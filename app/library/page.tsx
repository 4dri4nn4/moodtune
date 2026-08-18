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
  orderBy,
  query,
} from "firebase/firestore";

import { auth, db } from "@/lib/firebase";
import MoodTuneLogo from "@/components/ui/MoodTuneLogo";
import {
  usePlayer,
  type Track,
} from "@/components/player/PlayerProvider";

export default function LibraryPage() {
  const router = useRouter();
  const { loadQueue } = usePlayer();

  const [user, setUser] = useState<User | null>(null);
  const [favourites, setFavourites] = useState<Track[]>([]);

  const [authLoading, setAuthLoading] = useState(true);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [removingTrackId, setRemovingTrackId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser);
        setAuthLoading(false);
        setError("");

        if (currentUser) {
          setLibraryLoading(true);
        } else {
          setFavourites([]);
          setLibraryLoading(false);
        }
      }
    );

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) {
      return;
    }

    const favouritesQuery = query(
      collection(
        db,
        "users",
        user.uid,
        "favourites"
      ),
      orderBy("savedAt", "desc")
    );

    const unsubscribe = onSnapshot(
      favouritesQuery,
      (snapshot) => {
        const savedTracks = snapshot.docs.map(
          (favouriteDocument) => {
            const data = favouriteDocument.data();

            return {
              id: favouriteDocument.id,
              title: data.title ?? "",
              artist: data.artist ?? "",
              genre: data.genre ?? "",
              audioURL: data.audioURL ?? "",
              coverURL: data.coverURL ?? "pending",
              duration: data.duration ?? 0,
              emotionTags: data.emotionTags ?? [],
            } satisfies Track;
          }
        );

        setFavourites(savedTracks);
        setError("");
        setLibraryLoading(false);
      },
      (libraryError) => {
        console.error(
          "Library loading error:",
          libraryError
        );

        setError(
          "We couldn't load your saved music."
        );

        setLibraryLoading(false);
      }
    );

    return unsubscribe;
  }, [user]);

  function handlePlayTrack(track: Track) {
    loadQueue(
      favourites,
      track.id,
      {
        journey: "library",
        emotion: "",
      }
    );

    const parameters = new URLSearchParams({
      track: track.id,
      journey: "library",
    });

    router.push(
      `/player?${parameters.toString()}`
    );
  }

  async function handleRemoveFavourite(
    trackId: string
  ) {
    if (!user || removingTrackId) {
      return;
    }

    try {
      setRemovingTrackId(trackId);
      setError("");

      await deleteDoc(
        doc(
          db,
          "users",
          user.uid,
          "favourites",
          trackId
        )
      );
    } catch (removeError) {
      console.error(
        "Remove favourite error:",
        removeError
      );

      setError(
        "We couldn't remove this track from your favourites."
      );
    } finally {
      setRemovingTrackId("");
    }
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

      <section className="emotion-panel library-panel">
        <div className="emotion-heading">
          <p className="eyebrow auth-eyebrow">
            YOUR MUSIC
          </p>

          <h1>
            Your{" "}
            <span className="results-emotion">
              favourites
            </span>
          </h1>

          <p>
            Revisit the tracks you saved and play
            them directly inside MoodTune.
          </p>
        </div>

        {authLoading && (
          <p className="auth-description">
            Checking your account...
          </p>
        )}

        {!authLoading && !user && (
          <div className="library-message">
            <div
              className="library-message-icon"
              aria-hidden="true"
            >
              ♡
            </div>

            <h2>
              Sign in to view your Library
            </h2>

            <p>
              Your favourites are saved securely
              to your MoodTune account.
            </p>

            <Link
              href="/login"
              className="button"
            >
              Sign in
            </Link>

            <Link
              href="/register"
              className="text-link"
            >
              Create an account
            </Link>
          </div>
        )}

        {!authLoading &&
          user &&
          libraryLoading && (
            <p className="auth-description">
              Loading your saved music...
            </p>
          )}

        {error && (
          <p className="results-error">
            {error}
          </p>
        )}

        {!authLoading &&
          user &&
          !libraryLoading &&
          !error &&
          favourites.length === 0 && (
            <div className="library-message">
              <div
                className="library-message-icon"
                aria-hidden="true"
              >
                ♡
              </div>

              <h2>
                Your Library is waiting
              </h2>

              <p>
                Browse your MoodTune recommendations
                and press the heart button to save
                tracks here.
              </p>

              <Link
                href="/browse"
                className="button"
              >
                Find music
              </Link>
            </div>
          )}

        {!authLoading &&
          user &&
          !libraryLoading &&
          favourites.length > 0 && (
            <>
              <p className="library-count">
                {favourites.length}{" "}
                {favourites.length === 1
                  ? "saved track"
                  : "saved tracks"}
              </p>

              <div className="results-grid">
                {favourites.map((track) => (
                  <article
                    key={track.id}
                    className="result-track-card"
                  >
                    <div className="result-track-main">
                      {track.coverURL ===
                      "pending" ? (
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

                        <h2>
                          {track.title}
                        </h2>

                        <p>
                          {track.artist}
                        </p>
                      </div>
                    </div>

                    <div className="library-track-actions">
                      <button
                        type="button"
                        className="library-remove-button"
                        onClick={() =>
                          handleRemoveFavourite(
                            track.id
                          )
                        }
                        disabled={
                          removingTrackId ===
                          track.id
                        }
                        aria-label={
                          `Remove ${track.title} ` +
                          "from favourites"
                        }
                      >
                        {removingTrackId ===
                        track.id
                          ? "Removing..."
                          : "♥"}
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
                ))}
              </div>
            </>
          )}
      </section>
    </main>
  );
}