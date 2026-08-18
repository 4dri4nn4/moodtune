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
  type DocumentData,
} from "firebase/firestore";

import { auth, db } from "@/lib/firebase";
import MoodTuneLogo from "@/components/ui/MoodTuneLogo";
import {
  usePlayer,
  type Track,
} from "@/components/player/PlayerProvider";

type LibraryTab =
  | "favourites"
  | "history";

function createTrack(
  id: string,
  data: DocumentData
): Track {
  return {
    id,
    title: data.title ?? "",
    artist: data.artist ?? "",
    genre: data.genre ?? "",
    audioURL: data.audioURL ?? "",
    coverURL:
      data.coverURL ?? "pending",
    duration: data.duration ?? 0,
    emotionTags:
      data.emotionTags ?? [],
  };
}

export default function LibraryPage() {
  const router = useRouter();
  const { loadQueue } = usePlayer();

  const [user, setUser] =
    useState<User | null>(null);

  const [activeTab, setActiveTab] =
    useState<LibraryTab>("favourites");

  const [favourites, setFavourites] =
    useState<Track[]>([]);

  const [history, setHistory] =
    useState<Track[]>([]);

  const [authLoading, setAuthLoading] =
    useState(true);

  const [
    favouritesLoading,
    setFavouritesLoading,
  ] = useState(false);

  const [
    historyLoading,
    setHistoryLoading,
  ] = useState(false);

  const [
    removingTrackId,
    setRemovingTrackId,
  ] = useState("");

  const [
    favouritesError,
    setFavouritesError,
  ] = useState("");

  const [
    historyError,
    setHistoryError,
  ] = useState("");

  useEffect(() => {
    return onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser);
        setAuthLoading(false);
        setFavouritesError("");
        setHistoryError("");

        if (currentUser) {
          setFavouritesLoading(true);
          setHistoryLoading(true);
        } else {
          setFavourites([]);
          setHistory([]);
          setFavouritesLoading(false);
          setHistoryLoading(false);
        }
      }
    );
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

    return onSnapshot(
      favouritesQuery,
      (snapshot) => {
        const savedTracks =
          snapshot.docs.map(
            (favouriteDocument) =>
              createTrack(
                favouriteDocument.id,
                favouriteDocument.data()
              )
          );

        setFavourites(savedTracks);
        setFavouritesError("");
        setFavouritesLoading(false);
      },
      (error) => {
        console.error(
          "Favourites loading error:",
          error
        );

        setFavouritesError(
          "We couldn't load your favourites."
        );

        setFavouritesLoading(false);
      }
    );
  }, [user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const historyQuery = query(
      collection(
        db,
        "users",
        user.uid,
        "listeningHistory"
      ),
      orderBy("lastPlayedAt", "desc")
    );

    return onSnapshot(
      historyQuery,
      (snapshot) => {
        const recentTracks =
          snapshot.docs.map(
            (historyDocument) =>
              createTrack(
                historyDocument.id,
                historyDocument.data()
              )
          );

        setHistory(recentTracks);
        setHistoryError("");
        setHistoryLoading(false);
      },
      (error) => {
        console.error(
          "History loading error:",
          error
        );

        setHistoryError(
          "We couldn't load your listening history."
        );

        setHistoryLoading(false);
      }
    );
  }, [user]);

  function handlePlayTrack(
    track: Track,
    tracks: Track[]
  ) {
    loadQueue(
      tracks,
      track.id,
      {
        journey: "library",
        emotion: "",
      }
    );

    const parameters =
      new URLSearchParams({
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
      setFavouritesError("");

      await deleteDoc(
        doc(
          db,
          "users",
          user.uid,
          "favourites",
          trackId
        )
      );
    } catch (error) {
      console.error(
        "Remove favourite error:",
        error
      );

      setFavouritesError(
        "We couldn't remove this track from your favourites."
      );
    } finally {
      setRemovingTrackId("");
    }
  }

  async function handleRemoveHistory(
    trackId: string
  ) {
    if (!user || removingTrackId) {
      return;
    }

    try {
      setRemovingTrackId(trackId);
      setHistoryError("");

      await deleteDoc(
        doc(
          db,
          "users",
          user.uid,
          "listeningHistory",
          trackId
        )
      );
    } catch (error) {
      console.error(
        "Remove history error:",
        error
      );

      setHistoryError(
        "We couldn't remove this track from your history."
      );
    } finally {
      setRemovingTrackId("");
    }
  }

  const visibleTracks =
    activeTab === "favourites"
      ? favourites
      : history;

  const visibleLoading =
    activeTab === "favourites"
      ? favouritesLoading
      : historyLoading;

  const visibleError =
    activeTab === "favourites"
      ? favouritesError
      : historyError;

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
              Library
            </span>
          </h1>

          <p>
            Revisit your favourite tracks
            and recently played music.
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
              Your favourites and listening
              history are saved securely to
              your MoodTune account.
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

        {!authLoading && user && (
          <>
            <div
              className="library-tabs"
              role="tablist"
              aria-label="Library sections"
            >
              <button
                type="button"
                role="tab"
                aria-selected={
                  activeTab ===
                  "favourites"
                }
                className={
                  activeTab ===
                  "favourites"
                    ? "library-tab active"
                    : "library-tab"
                }
                onClick={() =>
                  setActiveTab(
                    "favourites"
                  )
                }
              >
                <span aria-hidden="true">
                  ♥
                </span>

                <span>
                  Favourites
                </span>

                <span className="library-tab-count">
                  {favourites.length}
                </span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={
                  activeTab === "history"
                }
                className={
                  activeTab === "history"
                    ? "library-tab active"
                    : "library-tab"
                }
                onClick={() =>
                  setActiveTab("history")
                }
              >
                <span aria-hidden="true">
                  ↻
                </span>

                <span>
                  Recently played
                </span>

                <span className="library-tab-count">
                  {history.length}
                </span>
              </button>
            </div>

            {visibleLoading && (
              <p className="auth-description">
                {activeTab ===
                "favourites"
                  ? "Loading your favourites..."
                  : "Loading your listening history..."}
              </p>
            )}

            {visibleError && (
              <p className="results-error">
                {visibleError}
              </p>
            )}

            {!visibleLoading &&
              !visibleError &&
              visibleTracks.length ===
                0 && (
                <div className="library-message">
                  <div
                    className="library-message-icon"
                    aria-hidden="true"
                  >
                    {activeTab ===
                    "favourites"
                      ? "♡"
                      : "↻"}
                  </div>

                  <h2>
                    {activeTab ===
                    "favourites"
                      ? "Your favourites are waiting"
                      : "Nothing played yet"}
                  </h2>

                  <p>
                    {activeTab ===
                    "favourites"
                      ? "Browse your recommendations and press the heart button to save tracks here."
                      : "Tracks will appear here after you start listening to them."}
                  </p>

                  <Link
                    href="/browse?journey=feel"
                    className="button"
                  >
                    Find music
                  </Link>
                </div>
              )}

            {!visibleLoading &&
              visibleTracks.length > 0 && (
                <>
                  <p className="library-count">
                    {visibleTracks.length}{" "}
                    {visibleTracks.length ===
                    1
                      ? activeTab ===
                        "favourites"
                        ? "saved track"
                        : "recent track"
                      : activeTab ===
                          "favourites"
                        ? "saved tracks"
                        : "recent tracks"}
                  </p>

                  <div className="results-grid">
                    {visibleTracks.map(
                      (track) => (
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
                                src={
                                  track.coverURL
                                }
                                alt={`${track.title} cover`}
                                width={72}
                                height={72}
                                className="result-cover"
                              />
                            )}

                            <div className="result-track-details">
                              <p className="result-genre">
                                {
                                  track.genre
                                }
                              </p>

                              <h2>
                                {
                                  track.title
                                }
                              </h2>

                              <p>
                                {
                                  track.artist
                                }
                              </p>
                            </div>
                          </div>

                          <div className="library-track-actions">
                            <button
                              type="button"
                              className={
                                activeTab ===
                                "favourites"
                                  ? "library-remove-button"
                                  : "history-remove-button"
                              }
                              onClick={() =>
                                activeTab ===
                                "favourites"
                                  ? handleRemoveFavourite(
                                      track.id
                                    )
                                  : handleRemoveHistory(
                                      track.id
                                    )
                              }
                              disabled={
                                removingTrackId ===
                                track.id
                              }
                              aria-label={
                                activeTab ===
                                "favourites"
                                  ? `Remove ${track.title} from favourites`
                                  : `Remove ${track.title} from listening history`
                              }
                            >
                              {removingTrackId ===
                              track.id
                                ? "Removing..."
                                : activeTab ===
                                    "favourites"
                                  ? "♥"
                                  : "×"}
                            </button>

                            <button
                              type="button"
                              className="result-play-button"
                              onClick={() =>
                                handlePlayTrack(
                                  track,
                                  visibleTracks
                                )
                              }
                            >
                              Play →
                            </button>
                          </div>
                        </article>
                      )
                    )}
                  </div>
                </>
              )}
          </>
        )}
      </section>
    </main>
  );
}