"use client";

import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";

import { db } from "@/lib/firebase";
import MoodTuneLogo from "@/components/ui/MoodTuneLogo";

type Track = {
  title: string;
  artist: string;
  genre: string;
  audioURL: string;
  coverURL: string;
  duration: number;
  emotionTags: string[];
};

export default function PlayerPage() {
  const searchParams = useSearchParams();
  const trackId = searchParams.get("track");

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [track, setTrack] = useState<Track | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);

  useEffect(() => {
    async function loadTrack() {
      if (!trackId) {
        setError("No track was selected.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const trackReference = doc(
          db,
          "tracks",
          trackId
        );

        const snapshot = await getDoc(
          trackReference
        );

        if (!snapshot.exists()) {
          setError(
            "This track could not be found."
          );
          return;
        }

        setTrack(snapshot.data() as Track);
      } catch (error) {
        console.error(
          "Track loading error:",
          error
        );

        setError(
          "We couldn't load this track."
        );
      } finally {
        setLoading(false);
      }
    }

    loadTrack();
  }, [trackId]);

  async function handlePlayPause() {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    try {
      if (audio.paused) {
        await audio.play();
        setIsPlaying(true);
      } else {
        audio.pause();
        setIsPlaying(false);
      }
    } catch (error) {
      console.error(
        "Audio playback error:",
        error
      );

      setError(
        "We couldn't play this audio file."
      );
    }
  }

  function handleTimeUpdate() {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    setCurrentTime(audio.currentTime);
  }

  function handleLoadedMetadata() {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    setAudioDuration(audio.duration);
  }

  function handleSeek(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const newTime = Number(
      event.target.value
    );

    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    audio.currentTime = newTime;
    setCurrentTime(newTime);
  }

  function formatTime(seconds: number) {
    if (!Number.isFinite(seconds)) {
      return "0:00";
    }

    const minutes = Math.floor(
      seconds / 60
    );

    const remainingSeconds = Math.floor(
      seconds % 60
    );

    return `${minutes}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  }

  return (
    <main className="emotion-page">
      <div className="auth-brand">
        <MoodTuneLogo size={62} />

        <div className="auth-brand-name">
          Mood<span>Tune</span>
        </div>

        <p>
          Every emotion has a soundtrack.
        </p>
      </div>

      <section className="player-panel">
        <div className="emotion-heading">
          <p className="eyebrow auth-eyebrow">
            NOW PLAYING
          </p>

          {loading && (
            <h1>
              Loading your track...
            </h1>
          )}

          {error && (
            <>
              <h1>
                Something went wrong
              </h1>

              <p>{error}</p>
            </>
          )}

          {!loading &&
            !error &&
            track && (
              <>
                <h1>{track.title}</h1>

                <p className="player-artist">
                  {track.artist}
                </p>
              </>
            )}
        </div>

        {!loading &&
          !error &&
          track && (
            <div className="player-card">
              <audio
                ref={audioRef}
                src={track.audioURL}
                preload="metadata"
                onLoadedMetadata={
                  handleLoadedMetadata
                }
                onTimeUpdate={
                  handleTimeUpdate
                }
                onEnded={() =>
                  setIsPlaying(false)
                }
              />

              <div className="player-artwork">
                {track.coverURL ===
                "pending" ? (
                  <div className="player-artwork-placeholder">
                    ♪
                  </div>
                ) : (
                  <img
                    src={track.coverURL}
                    alt={`${track.title} cover`}
                  />
                )}
              </div>

              <div className="player-track-info">
                <p className="result-genre">
                  {track.genre}
                </p>

                <h2>
                  {track.title}
                </h2>

                <p>
                  {track.artist}
                </p>

                <div className="player-tags">
                  {track.emotionTags?.map(
                    (emotion) => (
                      <span
                        key={emotion}
                      >
                        {emotion}
                      </span>
                    )
                  )}
                </div>
              </div>

              <div className="player-progress">
                <input
                  type="range"
                  min="0"
                  max={
                    audioDuration || 0
                  }
                  value={currentTime}
                  step="0.1"
                  onChange={handleSeek}
                  aria-label="Track progress"
                />

                <div className="player-time">
                  <span>
                    {formatTime(
                      currentTime
                    )}
                  </span>

                  <span>
                    {formatTime(
                      audioDuration
                    )}
                  </span>
                </div>
              </div>

              <div className="player-controls-placeholder">
                <button
                  type="button"
                  disabled
                  aria-label="Previous track"
                >
                  ◀
                </button>

                <button
                  type="button"
                  className="player-main-button"
                  onClick={
                    handlePlayPause
                  }
                  aria-label={
                    isPlaying
                      ? "Pause"
                      : "Play"
                  }
                >
                  {isPlaying
                    ? "❚❚"
                    : "▶"}
                </button>

                <button
                  type="button"
                  disabled
                  aria-label="Next track"
                >
                  ▶
                </button>
              </div>
            </div>
          )}

        <Link
          href="/browse"
          className="auth-home-link results-back-link"
        >
          ← Choose another emotion
        </Link>
      </section>
    </main>
  );
}