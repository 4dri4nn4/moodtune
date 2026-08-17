"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import MoodTuneLogo from "@/components/ui/MoodTuneLogo";
import { usePlayer, type Track } from "@/components/player/PlayerProvider";

type ResultsViewProps = { journey: string; emotion: string };

export default function ResultsView({ journey, emotion }: ResultsViewProps) {
  const router = useRouter();
  const { loadQueue } = usePlayer();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function loadTracks() {
      if (!emotion) {
        if (active) { setError("No emotion was selected."); setLoading(false); }
        return;
      }
      try {
        setLoading(true);
        setError("");
        const tracksQuery = query(collection(db, "tracks"), where("emotionTags", "array-contains", emotion));
        const snapshot = await getDocs(tracksQuery);
        if (!active) return;
        setTracks(snapshot.docs.map((document) => ({
          id: document.id,
          ...(document.data() as Omit<Track, "id">),
        })));
      } catch (trackError) {
        console.error("Track query error:", trackError);
        if (active) setError("We couldn't load your MoodTune recommendations.");
      } finally {
        if (active) setLoading(false);
      }
    }
    loadTracks();
    return () => { active = false; };
  }, [emotion]);

  function handlePlayTrack(track: Track) {
    loadQueue(tracks, track.id, { journey, emotion });
    const parameters = new URLSearchParams({ track: track.id, journey, emotion });
    router.push(`/player?${parameters.toString()}`);
  }

  return (
    <main className="emotion-page">
      <div className="auth-brand">
        <MoodTuneLogo size={62} />
        <div className="auth-brand-name">Mood<span>Tune</span></div>
        <p>Every emotion has a soundtrack.</p>
      </div>
      <section className="emotion-panel">
        <div className="emotion-heading">
          <p className="eyebrow auth-eyebrow">YOUR MOODTUNE</p>
          <h1>
            {journey === "want" ? "Music to help you feel" : "Music for when you feel"}<br />
            <span className="results-emotion">{emotion || "your mood"}</span>
          </h1>
          <p>MoodTune matched your selected emotion with tracks from your personalised music catalogue.</p>
        </div>
        {loading && <p className="auth-description">Finding your soundtrack...</p>}
        {error && <p className="results-error">{error}</p>}
        {!loading && !error && tracks.length === 0 && (
          <div className="results-empty"><h2>No matching tracks yet</h2><p>We don&apos;t currently have a track tagged with this emotion.</p></div>
        )}
        {!loading && !error && tracks.length > 0 && (
          <div className="results-grid">
            {tracks.map((track) => (
              <article key={track.id} className="result-track-card">
                <div className="result-track-main">
                  {track.coverURL === "pending" ? <div className="result-cover-placeholder">♪</div> : (
                    <Image src={track.coverURL} alt={`${track.title} cover`} width={72} height={72} className="result-cover" />
                  )}
                  <div className="result-track-details">
                    <p className="result-genre">{track.genre}</p><h2>{track.title}</h2><p>{track.artist}</p>
                  </div>
                </div>
                <button type="button" className="result-play-button" onClick={() => handlePlayTrack(track)}>Play →</button>
              </article>
            ))}
          </div>
        )}
        <Link href="/browse" className="auth-home-link results-back-link">← Choose another emotion</Link>
      </section>
    </main>
  );
}
