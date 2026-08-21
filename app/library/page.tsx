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
  getDocs,
  onSnapshot,
  orderBy,
  query,
  type DocumentData,
  updateDoc,
  writeBatch,
} from "firebase/firestore";

import { auth, db } from "@/lib/firebase";
import MoodTuneLogo from "@/components/ui/MoodTuneLogo";
import {
  usePlayer,
  type Track,
} from "@/components/player/PlayerProvider";

type LibraryTab =
  | "favourites"
  | "history"
  | "playlists";

type Playlist = {
  id: string;
  name: string;
  tracks: Track[];
  tracksLoading: boolean;
};

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
    coverURL: data.coverURL ?? "pending",
    duration: data.duration ?? 0,
    emotionTags: data.emotionTags ?? [],
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

  const [playlists, setPlaylists] =
    useState<Playlist[]>([]);

  const [
    selectedPlaylistId,
    setSelectedPlaylistId,
  ] = useState<string | null>(null);

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
    playlistsLoading,
    setPlaylistsLoading,
  ] = useState(false);

  const [
    removingTrackId,
    setRemovingTrackId,
  ] = useState("");

  const [
    deletingPlaylistId,
    setDeletingPlaylistId,
  ] = useState("");

  const [
    editingPlaylistId,
    setEditingPlaylistId,
  ] = useState("");

  const [
    editedPlaylistName,
    setEditedPlaylistName,
  ] = useState("");

  const [
    savingPlaylistName,
    setSavingPlaylistName,
  ] = useState(false);

  const [
    favouritesError,
    setFavouritesError,
  ] = useState("");

  const [
    historyError,
    setHistoryError,
  ] = useState("");

  const [
    playlistsError,
    setPlaylistsError,
  ] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser);
        setAuthLoading(false);

        setFavouritesError("");
        setHistoryError("");
        setPlaylistsError("");

        if (currentUser) {
          setFavouritesLoading(true);
          setHistoryLoading(true);
          setPlaylistsLoading(true);
        } else {
          setFavourites([]);
          setHistory([]);
          setPlaylists([]);
          setSelectedPlaylistId(null);

          setFavouritesLoading(false);
          setHistoryLoading(false);
          setPlaylistsLoading(false);
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
      (snapshotError) => {
        console.error(
          "Favourites loading error:",
          snapshotError
        );

        setFavouritesError(
          "We couldn't load your favourites."
        );

        setFavouritesLoading(false);
      }
    );

    return unsubscribe;
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

    const unsubscribe = onSnapshot(
      historyQuery,
      (snapshot) => {
        const recentTracks = snapshot.docs.map(
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
      (snapshotError) => {
        console.error(
          "History loading error:",
          snapshotError
        );

        setHistoryError(
          "We couldn't load your listening history."
        );

        setHistoryLoading(false);
      }
    );

    return unsubscribe;
  }, [user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    let trackUnsubscribes: Array<
      () => void
    > = [];

    const playlistsQuery = query(
      collection(
        db,
        "users",
        user.uid,
        "playlists"
      ),
      orderBy("createdAt", "desc")
    );

    const unsubscribePlaylists = onSnapshot(
      playlistsQuery,
      (snapshot) => {
        trackUnsubscribes.forEach(
          (unsubscribe) => unsubscribe()
        );

        trackUnsubscribes = [];

        const loadedPlaylists: Playlist[] =
          snapshot.docs.map(
            (playlistDocument) => ({
              id: playlistDocument.id,
              name:
                typeof playlistDocument.data()
                  .name === "string"
                  ? playlistDocument.data().name
                  : "Untitled playlist",
              tracks: [],
              tracksLoading: true,
            })
          );

        setPlaylists(loadedPlaylists);
        setPlaylistsError("");
        setPlaylistsLoading(false);

        snapshot.docs.forEach(
          (playlistDocument) => {
            const playlistTracksQuery = query(
              collection(
                db,
                "users",
                user.uid,
                "playlists",
                playlistDocument.id,
                "tracks"
              ),
              orderBy("addedAt", "desc")
            );

            const unsubscribeTracks =
              onSnapshot(
                playlistTracksQuery,
                (tracksSnapshot) => {
                  const playlistTracks =
                    tracksSnapshot.docs.map(
                      (trackDocument) =>
                        createTrack(
                          trackDocument.id,
                          trackDocument.data()
                        )
                    );

                  setPlaylists(
                    (currentPlaylists) =>
                      currentPlaylists.map(
                        (playlist) =>
                          playlist.id ===
                          playlistDocument.id
                            ? {
                                ...playlist,
                                tracks:
                                  playlistTracks,
                                tracksLoading:
                                  false,
                              }
                            : playlist
                      )
                  );
                },
                (snapshotError) => {
                  console.error(
                    "Playlist tracks loading error:",
                    snapshotError
                  );

                  setPlaylistsError(
                    "We couldn't load all of your playlist tracks."
                  );

                  setPlaylists(
                    (currentPlaylists) =>
                      currentPlaylists.map(
                        (playlist) =>
                          playlist.id ===
                          playlistDocument.id
                            ? {
                                ...playlist,
                                tracksLoading:
                                  false,
                              }
                            : playlist
                      )
                  );
                }
              );

            trackUnsubscribes.push(
              unsubscribeTracks
            );
          }
        );
      },
      (snapshotError) => {
        console.error(
          "Playlists loading error:",
          snapshotError
        );

        setPlaylistsError(
          "We couldn't load your playlists."
        );

        setPlaylistsLoading(false);
      }
    );

    return () => {
      unsubscribePlaylists();

      trackUnsubscribes.forEach(
        (unsubscribe) => unsubscribe()
      );
    };
  }, [user]);

  const selectedPlaylist =
    playlists.find(
      (playlist) =>
        playlist.id === selectedPlaylistId
    ) ?? null;

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

  function handlePlayTrack(
    track: Track,
    tracks: Track[]
  ) {
    if (tracks.length === 0) {
      return;
    }

    loadQueue(tracks, track.id, {
      journey:
        activeTab === "playlists"
          ? "playlist"
          : "library",
      emotion: "",
    });

    const parameters = new URLSearchParams({
      track: track.id,
      journey:
        activeTab === "playlists"
          ? "playlist"
          : "library",
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
    } catch (removeError) {
      console.error(
        "Remove favourite error:",
        removeError
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
    } catch (removeError) {
      console.error(
        "Remove history error:",
        removeError
      );

      setHistoryError(
        "We couldn't remove this track from your history."
      );
    } finally {
      setRemovingTrackId("");
    }
  }

  async function handleRemovePlaylistTrack(
    playlistId: string,
    trackId: string
  ) {
    if (!user || removingTrackId) {
      return;
    }

    const removalId =
      `${playlistId}:${trackId}`;

    try {
      setRemovingTrackId(removalId);
      setPlaylistsError("");

      await deleteDoc(
        doc(
          db,
          "users",
          user.uid,
          "playlists",
          playlistId,
          "tracks",
          trackId
        )
      );

      await updateDoc(
        doc(
          db,
          "users",
          user.uid,
          "playlists",
          playlistId
        ),
        {
          updatedAt: new Date(),
        }
      );
    } catch (removeError) {
      console.error(
        "Remove playlist track error:",
        removeError
      );

      setPlaylistsError(
        "We couldn't remove this track from the playlist."
      );
    } finally {
      setRemovingTrackId("");
    }
  }

  function startRenamingPlaylist(
    playlist: Playlist
  ) {
    setEditingPlaylistId(playlist.id);
    setEditedPlaylistName(playlist.name);
    setPlaylistsError("");
  }

  function cancelRenamingPlaylist() {
    setEditingPlaylistId("");
    setEditedPlaylistName("");
  }

  async function handleRenamePlaylist(
    playlistId: string
  ) {
    if (
      !user ||
      savingPlaylistName
    ) {
      return;
    }

    const cleanedName =
      editedPlaylistName.trim();

    if (!cleanedName) {
      setPlaylistsError(
        "Please enter a playlist name."
      );
      return;
    }

    try {
      setSavingPlaylistName(true);
      setPlaylistsError("");

      await updateDoc(
        doc(
          db,
          "users",
          user.uid,
          "playlists",
          playlistId
        ),
        {
          name: cleanedName,
          updatedAt: new Date(),
        }
      );

      cancelRenamingPlaylist();
    } catch (renameError) {
      console.error(
        "Rename playlist error:",
        renameError
      );

      setPlaylistsError(
        "We couldn't rename this playlist."
      );
    } finally {
      setSavingPlaylistName(false);
    }
  }

  async function handleDeletePlaylist(
    playlist: Playlist
  ) {
    if (
      !user ||
      deletingPlaylistId
    ) {
      return;
    }

    const confirmed = window.confirm(
      `Delete "${playlist.name}"? This will remove the playlist, but it will not delete the tracks from MoodTune.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingPlaylistId(
        playlist.id
      );

      setPlaylistsError("");

      const tracksReference = collection(
        db,
        "users",
        user.uid,
        "playlists",
        playlist.id,
        "tracks"
      );

      const tracksSnapshot =
        await getDocs(tracksReference);

      const batch = writeBatch(db);

      tracksSnapshot.docs.forEach(
        (trackDocument) => {
          batch.delete(
            doc(
              db,
              "users",
              user.uid,
              "playlists",
              playlist.id,
              "tracks",
              trackDocument.id
            )
          );
        }
      );

      batch.delete(
        doc(
          db,
          "users",
          user.uid,
          "playlists",
          playlist.id
        )
      );

      await batch.commit();

      if (
        selectedPlaylistId === playlist.id
      ) {
        setSelectedPlaylistId(null);
      }

      if (
        editingPlaylistId === playlist.id
      ) {
        cancelRenamingPlaylist();
      }
    } catch (deleteError) {
      console.error(
        "Delete playlist error:",
        deleteError
      );

      setPlaylistsError(
        "We couldn't delete this playlist."
      );
    } finally {
      setDeletingPlaylistId("");
    }
  }

  function renderTrackCard(
    track: Track,
    tracks: Track[],
    removeAction: () => void,
    removeLabel: string,
    removeButtonText: string,
    removalId: string,
    removeButtonClass: string
  ) {
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

        <div className="library-track-actions">
          <button
            type="button"
            className={removeButtonClass}
            onClick={removeAction}
            disabled={
              removingTrackId === removalId
            }
            aria-label={removeLabel}
          >
            {removingTrackId === removalId
              ? "Removing..."
              : removeButtonText}
          </button>

          <button
            type="button"
            className="result-play-button"
            onClick={() =>
              handlePlayTrack(track, tracks)
            }
          >
            Play →
          </button>
        </div>
      </article>
    );
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
              Library
            </span>
          </h1>

          <p>
            Revisit your favourites,
            recently played music and
            personal playlists.
          </p>
        </div>

        {authLoading ? (
          <p className="auth-description">
            Checking your account...
          </p>
        ) : null}

        {!authLoading && !user ? (
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
              Your favourites, listening
              history and playlists are
              saved securely to your
              MoodTune account.
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
        ) : null}

        {!authLoading && user ? (
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
                  activeTab === "favourites"
                }
                className={
                  activeTab === "favourites"
                    ? "library-tab active"
                    : "library-tab"
                }
                onClick={() => {
                  setActiveTab("favourites");
                  setSelectedPlaylistId(null);
                }}
              >
                <span aria-hidden="true">
                  ♥
                </span>

                <span>Favourites</span>

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
                onClick={() => {
                  setActiveTab("history");
                  setSelectedPlaylistId(null);
                }}
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

              <button
                type="button"
                role="tab"
                aria-selected={
                  activeTab === "playlists"
                }
                className={
                  activeTab === "playlists"
                    ? "library-tab active"
                    : "library-tab"
                }
                onClick={() =>
                  setActiveTab("playlists")
                }
              >
                <span aria-hidden="true">
                  ♫
                </span>

                <span>Playlists</span>

                <span className="library-tab-count">
                  {playlists.length}
                </span>
              </button>
            </div>

            {activeTab !== "playlists" ? (
              <>
                {visibleLoading ? (
                  <p className="auth-description">
                    {activeTab ===
                    "favourites"
                      ? "Loading your favourites..."
                      : "Loading your listening history..."}
                  </p>
                ) : null}

                {visibleError ? (
                  <p className="results-error">
                    {visibleError}
                  </p>
                ) : null}

                {!visibleLoading &&
                !visibleError &&
                visibleTracks.length === 0 ? (
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
                ) : null}

                {!visibleLoading &&
                visibleTracks.length > 0 ? (
                  <>
                    <p className="library-count">
                      {visibleTracks.length}{" "}
                      {visibleTracks.length === 1
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
                        (track) =>
                          renderTrackCard(
                            track,
                            visibleTracks,
                            () => {
                              if (
                                activeTab ===
                                "favourites"
                              ) {
                                void handleRemoveFavourite(
                                  track.id
                                );
                              } else {
                                void handleRemoveHistory(
                                  track.id
                                );
                              }
                            },
                            activeTab ===
                            "favourites"
                              ? `Remove ${track.title} from favourites`
                              : `Remove ${track.title} from listening history`,
                            activeTab ===
                            "favourites"
                              ? "♥"
                              : "×",
                            track.id,
                            activeTab ===
                            "favourites"
                              ? "library-remove-button"
                              : "history-remove-button"
                          )
                      )}
                    </div>
                  </>
                ) : null}
              </>
            ) : null}

            {activeTab === "playlists" ? (
              <>
                {playlistsLoading ? (
                  <p className="auth-description">
                    Loading your playlists...
                  </p>
                ) : null}

                {playlistsError ? (
                  <p className="results-error">
                    {playlistsError}
                  </p>
                ) : null}

                {!playlistsLoading &&
                playlists.length === 0 ? (
                  <div className="library-message">
                    <div
                      className="library-message-icon"
                      aria-hidden="true"
                    >
                      ♫
                    </div>

                    <h2>
                      Create your first playlist
                    </h2>

                    <p>
                      Find a track you love,
                      select Add to playlist
                      and create your own
                      collection.
                    </p>

                    <Link
                      href="/browse?journey=feel"
                      className="button"
                    >
                      Find music
                    </Link>
                  </div>
                ) : null}

                {!playlistsLoading &&
                playlists.length > 0 &&
                !selectedPlaylist ? (
                  <>
                    <p className="library-count">
                      {playlists.length}{" "}
                      {playlists.length === 1
                        ? "playlist"
                        : "playlists"}
                    </p>

                    <div className="playlist-library-grid">
                      {playlists.map(
                        (playlist) => (
                          <article
                            key={playlist.id}
                            className="playlist-library-card"
                          >
                            <button
                              type="button"
                              className="playlist-library-open"
                              onClick={() =>
                                setSelectedPlaylistId(
                                  playlist.id
                                )
                              }
                            >
                              <span
                                className="playlist-library-icon"
                                aria-hidden="true"
                              >
                                ♫
                              </span>

                              <span className="playlist-library-information">
                                <strong>
                                  {
                                    playlist.name
                                  }
                                </strong>

                                <span>
                                  {playlist.tracksLoading
                                    ? "Loading tracks..."
                                    : `${playlist.tracks.length} ${
                                        playlist
                                          .tracks
                                          .length ===
                                        1
                                          ? "track"
                                          : "tracks"
                                      }`}
                                </span>
                              </span>

                              <span aria-hidden="true">
                                →
                              </span>
                            </button>

                            <div className="playlist-library-actions">
                              <button
                                type="button"
                                onClick={() =>
                                  startRenamingPlaylist(
                                    playlist
                                  )
                                }
                              >
                                Rename
                              </button>

                              <button
                                type="button"
                                className="playlist-delete-button"
                                onClick={() => {
                                  void handleDeletePlaylist(
                                    playlist
                                  );
                                }}
                                disabled={
                                  deletingPlaylistId ===
                                  playlist.id
                                }
                              >
                                {deletingPlaylistId ===
                                playlist.id
                                  ? "Deleting..."
                                  : "Delete"}
                              </button>
                            </div>

                            {editingPlaylistId ===
                            playlist.id ? (
                              <div className="playlist-rename-form">
                                <label
                                  htmlFor={`rename-${playlist.id}`}
                                >
                                  Playlist name
                                </label>

                                <input
                                  id={`rename-${playlist.id}`}
                                  type="text"
                                  value={
                                    editedPlaylistName
                                  }
                                  onChange={(
                                    event
                                  ) =>
                                    setEditedPlaylistName(
                                      event
                                        .target
                                        .value
                                    )
                                  }
                                  maxLength={60}
                                  autoFocus
                                />

                                <div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      void handleRenamePlaylist(
                                        playlist.id
                                      );
                                    }}
                                    disabled={
                                      savingPlaylistName ||
                                      !editedPlaylistName.trim()
                                    }
                                  >
                                    {savingPlaylistName
                                      ? "Saving..."
                                      : "Save"}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={
                                      cancelRenamingPlaylist
                                    }
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : null}
                          </article>
                        )
                      )}
                    </div>
                  </>
                ) : null}

                {selectedPlaylist ? (
                  <div className="selected-playlist">
                    <button
                      type="button"
                      className="selected-playlist-back"
                      onClick={() =>
                        setSelectedPlaylistId(
                          null
                        )
                      }
                    >
                      ← All playlists
                    </button>

                    <div className="selected-playlist-heading">
                      <div>
                        <p className="eyebrow auth-eyebrow">
                          PLAYLIST
                        </p>

                        <h2>
                          {
                            selectedPlaylist.name
                          }
                        </h2>

                        <p>
                          {selectedPlaylist
                            .tracks.length}{" "}
                          {selectedPlaylist
                            .tracks.length === 1
                            ? "track"
                            : "tracks"}
                        </p>
                      </div>

                      {selectedPlaylist.tracks
                        .length > 0 ? (
                        <button
                          type="button"
                          className="button playlist-play-all"
                          onClick={() =>
                            handlePlayTrack(
                              selectedPlaylist
                                .tracks[0],
                              selectedPlaylist
                                .tracks
                            )
                          }
                        >
                          Play all →
                        </button>
                      ) : null}
                    </div>

                    {selectedPlaylist.tracksLoading ? (
                      <p className="auth-description">
                        Loading playlist
                        tracks...
                      </p>
                    ) : null}

                    {!selectedPlaylist.tracksLoading &&
                    selectedPlaylist.tracks
                      .length === 0 ? (
                      <div className="library-message">
                        <div
                          className="library-message-icon"
                          aria-hidden="true"
                        >
                          ♫
                        </div>

                        <h2>
                          This playlist is empty
                        </h2>

                        <p>
                          Browse your
                          recommendations and
                          add some music to this
                          playlist.
                        </p>

                        <Link
                          href="/browse?journey=feel"
                          className="button"
                        >
                          Find music
                        </Link>
                      </div>
                    ) : null}

                    {!selectedPlaylist.tracksLoading &&
                    selectedPlaylist.tracks
                      .length > 0 ? (
                      <div className="results-grid">
                        {selectedPlaylist.tracks.map(
                          (track) =>
                            renderTrackCard(
                              track,
                              selectedPlaylist.tracks,
                              () => {
                                void handleRemovePlaylistTrack(
                                  selectedPlaylist.id,
                                  track.id
                                );
                              },
                              `Remove ${track.title} from ${selectedPlaylist.name}`,
                              "×",
                              `${selectedPlaylist.id}:${track.id}`,
                              "history-remove-button"
                            )
                        )}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </>
            ) : null}
          </>
        ) : null}
      </section>
    </main>
  );
}