"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import MoodTuneLogo from "@/components/ui/MoodTuneLogo";

type Track = {
  id: string;
  title: string;
  artist: string;
  genre: string;
  audioURL: string;
  coverURL: string;
  duration: number;
  emotionTags: string[];
};

export default function ResultsPage() {
  const searchParams = useSearchParams();

  const journey = searchParams.get("journey");
  const emotion = searchParams.get("emotion");

  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadTracks() {
      if (!emotion) {
        setError("No emotion was selected.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const tracksQuery = query(
          collection(db, "tracks"),
          where("emotionTags", "array-contains", emotion)
        );

        const snapshot = await getDocs(tracksQuery);

        const matchingTracks: Track[] =
          snapshot.docs.map((document) => ({
            id: document.id,
            ...(document.data() as Omit<Track, "id">),
          }));

        setTracks(matchingTracks);
      } catch (error) {
        console.error("Track query error:", error);
        setError(
          "We couldn't load your MoodTune recommendations."
        );
      } finally {
        setLoading(false);
      }
    }

    loadTracks();
  }, [emotion]);

  return (
    <main className="emotion-page">
      <div className="auth-brand">
        <MoodTuneLogo size={62} />

        <div className="auth-brand-name">
          Mood<span>Tune</span>
        </div>

        <p>Every emotion has a soundtrack.</p>
      </div>

      <section className="emotion-panel">
        <div className="emotion-heading">
          <p className="eyebrow auth-eyebrow">
            YOUR MOODTUNE
          </p>

          <h1>
            {journey === "want"
              ? "Music to help you feel"
              : "Music for when you feel"}
            <br />

            <span
              style={{
                textTransform: "capitalize",
                color: "#d85cff",
              }}
            >
              {emotion || "your mood"}
            </span>
          </h1>

          <p>
            MoodTune matched your selected emotion with tracks
            from your personalised music catalogue.
          </p>
        </div>

        {loading && (
          <p className="auth-description">
            Finding your soundtrack...
          </p>
        )}

        {error && (
          <p
            style={{
              color: "#ff72c8",
            }}
          >
            {error}
          </p>
        )}

        {!loading && !error && tracks.length === 0 && (
          <div className="results-empty">
            <h2>No matching tracks yet</h2>

            <p>
              We don't currently have a track tagged with this
              emotion.
            </p>
          </div>
        )}

        {!loading && tracks.length > 0 && (
          <div className="results-grid">
            {tracks.map((track) => (
              <article
                key={track.id}
                className="result-track-card"
              >
                <div>
                  <p className="result-genre">
                    {track.genre}
                  </p>

                  <h2>{track.title}</h2>

                  <p>{track.artist}</p>
                </div>

                <Link
                  href={`/player?track=${track.id}`}
                  className="result-play-button"
                >
                  Play →
                </Link>
              </article>
            ))}
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