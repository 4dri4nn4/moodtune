"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import {
  getDocs,
  query,
  where,
} from "firebase/firestore";

import { auth, db } from "@/lib/firebase";
import MoodTuneLogo from "@/components/ui/MoodTuneLogo";
import {
  usePlayer,
  type Track,
} from "@/components/player/PlayerProvider";

type ResultsViewProps = {
  journey: string;
  emotion: string;
};

export default function ResultsView({
  journey,
  emotion,
}: ResultsViewProps) {
  const router = useRouter();
  const { loadQueue } = usePlayer();

  const [user, setUser] = useState<User | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [favouriteIds, setFavouriteIds] = useState<Set<string>>(
    new Set()
  );

  const [loading, setLoading] = useState(true);
  const [savingTrackId, setSavingTrackId] = useState("");
  const [error, setError] = useState("");
  const [favouriteError, setFavouriteError] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);

      if (!currentUser) {
        setFavouriteIds(new Set());
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    let active = true;

    async function loadTracks() {
      if (!emotion) {
        if (active) {
          setError("No emotion was selected.");
          setLoading(false);
        }

        return;
      }

      try {
        setLoading(true);
        setError("");

        const tracksQuery = query(
          collection(db, "tracks"),
          where(
            "emotionTags",
            "array-contains",
            emotion
          )
        );

        const snapshot = await getDocs(tracksQuery);

        if (!active) {
          return;
        }

        const matchingTracks = snapshot.docs.map(
          (trackDocument) => ({
            id: trackDocument.id,
            ...(
              trackDocument.data() as Omit<Track, "id">
            ),
          })
        );

        setTracks(matchingTracks);
      } catch (trackError) {
        console.error("Track query error:", trackError);

        if (active) {
          setError(
            "We couldn't load your MoodTune recommendations."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadTracks();

    return () => {
      active = false;
    };
  }, [emotion]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const favouritesReference = collection(
      db,
      "users",
      user.uid,
      "favourites"
    );

    const unsubscribe = onSnapshot(
      favouritesReference,
      (snapshot) => {
        setFavouriteIds(
          new Set(
            snapshot.docs.map(
              (favouriteDocument) => favouriteDocument.id
            )
          )
        );
      },
      (favouritesError) => {
        console.error(
          "Favourite listener error:",
          favouritesError
        );

        setFavouriteError(
          "We couldn't check your saved tracks."
        );
      }
    );

    return unsubscribe;
  }, [user]);

  function handlePlayTrack(track: Track) {
    loadQueue(tracks, track.id, {
      journey,
      emotion,
    });

    const parameters = new URLSearchParams({
      track: track.id,
      journey,
      emotion,
    });

    router.push(`/player?${parameters.toString()}`);
  }

  async function handleToggleFavourite(track: Track) {
    if (!user) {
      router.push("/login");
      return;
    }

    if (savingTrackId) {
      return;
    }

    const favouriteReference = doc(
      db,
      "users",
      user.uid,
      "favourites",
      track.id
    );

    try {
      setSavingTrackId(track.id);
      setFavouriteError("");

      if (favouriteIds.has(track.id)) {
        await deleteDoc(favouriteReference);
      } else {
        await setDoc(favouriteReference, {
          title: track.title,
          artist: track.artist,
          genre: track.genre,
          audioURL: track.audioURL,
          coverURL: track.coverURL,
          duration: track.duration,
          emotionTags: track.emotionTags,
          savedAt: serverTimestamp(),
        });
      }
    } catch (saveError) {
      console.error("Favourite update error:", saveError);

      setFavouriteError(
        "We couldn't update your favourites. Please try again."
      );
    } finally {
      setSavingTrackId("");
    }
  }

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

            <span className="results-emotion">
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
          <p className="results-error">
            {error}
          </p>
        )}

        {favouriteError && (
          <p className="results-error">
            {favouriteError}
          </p>
        )}

        {!loading &&
          !error &&
          tracks.length === 0 && (
            <div className="results-empty">
              <h2>No matching tracks yet</h2>

              <p>
                We don&apos;t currently have a track tagged
                with this emotion.
              </p>
            </div>
          )}

        {!loading &&
          !error &&
          tracks.length > 0 && (
            <div className="results-grid">
              {tracks.map((track) => {
                const isFavourite = favouriteIds.has(track.id);
                const isSaving = savingTrackId === track.id;

                return (
                  <article
                    key={track.id}
                    className="result-track-card"
                  >
                    <div className="result-track-main">
                      {track.coverURL === "pending" ? (
                        <div className="result-cover-placeholder">
                          ♪
                        </div>
                      ) : (
                        <Image
                          src={track.coverURL}
                          alt={`${track.title} cover`}
                          width={72}
                          height={72}
                          className="result-cover"
                        />
                      )}

                      <div className="result-track-details">
                        <p className="result-genre">
                          {track.genre}
                        </p>

                        <h2>{track.title}</h2>

                        <p>{track.artist}</p>
                      </div>
                    </div>

                    <div className="result-track-actions">
                      <button
                        type="button"
                        className={`favourite-button ${
                          isFavourite
                            ? "favourite-button-active"
                            : ""
                        }`}
                        onClick={() =>
                          handleToggleFavourite(track)
                        }
                        disabled={isSaving}
                        aria-label={
                          isFavourite
                            ? `Remove ${track.title} from favourites`
                            : `Add ${track.title} to favourites`
                        }
                        aria-pressed={isFavourite}
                        title={
                          user
                            ? isFavourite
                              ? "Remove from favourites"
                              : "Add to favourites"
                            : "Sign in to save this track"
                        }
                      >
                        {isSaving
                          ? "…"
                          : isFavourite
                            ? "♥"
                            : "♡"}
                      </button>

                      <button
                        type="button"
                        className="result-play-button"
                        onClick={() =>
                          handlePlayTrack(track)
                        }
                      >
                        Play →
                      </button>
                    </div>
                  </article>
                );
              })}
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