"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ChangeEvent } from "react";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import MoodTuneLogo from "@/components/ui/MoodTuneLogo";
import { usePlayer, type Track } from "@/components/player/PlayerProvider";

type PlayerViewProps = { trackId: string; journey: string; emotion: string };

export default function PlayerView({ trackId, journey, emotion }: PlayerViewProps) {
  const router = useRouter();
  const {
    queue, currentTrack, currentIndex, isPlaying, currentTime, duration,
    error: playerError, loadQueue, togglePlay, playNext, playPrevious, seek, minimizePlayer,
  } = usePlayer();
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  useEffect(() => {
    let active = true;
    async function preparePlayer() {
      if (!trackId) { setPageError("No track was selected."); setLoading(false); return; }
      if (currentTrack?.id === trackId && queue.length > 0) { setPageError(""); setLoading(false); return; }
      try {
        setLoading(true);
        setPageError("");
        if (emotion) {
          const tracksQuery = query(collection(db, "tracks"), where("emotionTags", "array-contains", emotion));
          const snapshot = await getDocs(tracksQuery);
          if (!active) return;
          const matchingTracks: Track[] = snapshot.docs.map((document) => ({
            id: document.id,
            ...(document.data() as Omit<Track, "id">),
          }));
          if (!matchingTracks.some((track) => track.id === trackId)) {
            setPageError("This track is not available in the selected playlist.");
            return;
          }
          loadQueue(matchingTracks, trackId, { journey, emotion });
          return;
        }
        const snapshot = await getDoc(doc(db, "tracks", trackId));
        if (!active) return;
        if (!snapshot.exists()) { setPageError("This track could not be found."); return; }
        const selectedTrack: Track = { id: snapshot.id, ...(snapshot.data() as Omit<Track, "id">) };
        loadQueue([selectedTrack], trackId, { journey, emotion });
      } catch (trackError) {
        console.error("Player loading error:", trackError);
        if (active) setPageError("We couldn't load this track.");
      } finally {
        if (active) setLoading(false);
      }
    }
    preparePlayer();
    return () => { active = false; };
  }, [currentTrack?.id, emotion, journey, loadQueue, queue.length, trackId]);

  useEffect(() => {
    if (!currentTrack || currentTrack.id === trackId) return;
    const parameters = new URLSearchParams({ track: currentTrack.id, journey });
    if (emotion) parameters.set("emotion", emotion);
    router.replace(`/player?${parameters.toString()}`, { scroll: false });
  }, [currentTrack, emotion, journey, router, trackId]);

  function handleMinimize() {
    minimizePlayer();
    if (!emotion) { router.push("/browse"); return; }
    router.push(`/results?${new URLSearchParams({ journey, emotion }).toString()}`);
  }

  function formatTime(seconds: number) {
    if (!Number.isFinite(seconds)) return "0:00";
    return `${Math.floor(seconds / 60)}:${Math.floor(seconds % 60).toString().padStart(2, "0")}`;
  }

  const visibleError = pageError || playerError;

  return (
    <main className="emotion-page">
      <div className="auth-brand">
        <MoodTuneLogo size={62} />
        <div className="auth-brand-name">Mood<span>Tune</span></div>
        <p>Every emotion has a soundtrack.</p>
      </div>
      <section className="player-panel">
        {!loading && !visibleError && currentTrack && (
          <div className="player-panel-actions">
            <button type="button" className="player-minimize-button" onClick={handleMinimize} aria-label="Minimize player">
              <span aria-hidden="true">─</span><span>Minimize player</span>
            </button>
          </div>
        )}
        <div className="emotion-heading">
          <p className="eyebrow auth-eyebrow">NOW PLAYING</p>
          {loading && <h1>Loading your track...</h1>}
          {visibleError && <><h1>Something went wrong</h1><p>{visibleError}</p></>}
          {!loading && !visibleError && currentTrack && <><h1>Your soundtrack</h1><p>Listen, move through the playlist, or minimize the player while browsing.</p></>}
        </div>
        {!loading && !visibleError && currentTrack && (
          <div className="player-card">
            <div className="player-artwork">
              {currentTrack.coverURL === "pending" ? <div className="player-artwork-placeholder">♪</div> : (
                <Image src={currentTrack.coverURL} alt={`${currentTrack.title} cover`} width={220} height={220} priority />
              )}
            </div>
            <div className="player-track-info">
              <p className="result-genre">{currentTrack.genre}</p><h2>{currentTrack.title}</h2><p>{currentTrack.artist}</p>
              <div className="player-tags">{currentTrack.emotionTags?.map((tag) => <span key={tag}>{tag}</span>)}</div>
              {queue.length > 1 && <p className="player-queue-position">Track {currentIndex + 1} of {queue.length}</p>}
            </div>
            <div className="player-progress">
              <input type="range" min="0" max={duration || 0} value={currentTime} step="0.1"
                onChange={(event: ChangeEvent<HTMLInputElement>) => seek(Number(event.target.value))} aria-label="Track progress" />
              <div className="player-time"><span>{formatTime(currentTime)}</span><span>{formatTime(duration)}</span></div>
            </div>
            <div className="player-controls">
              <button type="button" onClick={playPrevious} disabled={queue.length < 2} aria-label="Previous track">◀</button>
              <button type="button" className="player-main-button" onClick={togglePlay} aria-label={isPlaying ? "Pause" : "Play"}>{isPlaying ? "❚❚" : "▶"}</button>
              <button type="button" onClick={playNext} disabled={queue.length < 2} aria-label="Next track">▶</button>
            </div>
          </div>
        )}
        <Link href="/browse" className="auth-home-link results-back-link">← Choose another emotion</Link>
      </section>
    </main>
  );
}
