"use client";

import {
  type FormEvent,
  type MouseEvent,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import {
  onAuthStateChanged,
  type User,
} from "firebase/auth";

import { auth, db } from "@/lib/firebase";
import type { Track } from "@/components/player/PlayerProvider";

type AddToPlaylistButtonProps = {
  track: Track;
};

type Playlist = {
  id: string;
  name: string;
};

export default function AddToPlaylistButton({
  track,
}: AddToPlaylistButtonProps) {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(
    auth.currentUser
  );
  const [authReady, setAuthReady] = useState(false);

  const [isOpen, setIsOpen] = useState(false);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [newPlaylistName, setNewPlaylistName] =
    useState("");

  const [loadingPlaylists, setLoadingPlaylists] =
    useState(false);
  const [creatingPlaylist, setCreatingPlaylist] =
    useState(false);
  const [savingToPlaylistId, setSavingToPlaylistId] =
    useState<string | null>(null);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] =
    useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser);
        setAuthReady(true);
      }
    );

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user || !isOpen) {
      return;
    }

    const playlistsReference = collection(
      db,
      "users",
      user.uid,
      "playlists"
    );

    const playlistsQuery = query(
      playlistsReference,
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      playlistsQuery,
      (snapshot) => {
        const loadedPlaylists: Playlist[] =
          snapshot.docs.map((playlistDocument) => {
            const playlistData =
              playlistDocument.data();

            return {
              id: playlistDocument.id,
              name:
                typeof playlistData.name === "string"
                  ? playlistData.name
                  : "Untitled playlist",
            };
          });

        setPlaylists(loadedPlaylists);
        setLoadingPlaylists(false);
      },
      (snapshotError) => {
        console.error(
          "Could not load playlists:",
          snapshotError
        );

        setError(
          "We couldn't load your playlists. Please try again."
        );
        setLoadingPlaylists(false);
      }
    );

    return unsubscribe;
  }, [isOpen, user]);

  const resetMessages = () => {
    setError("");
    setSuccessMessage("");
  };

  const handleOpen = () => {
    resetMessages();

    if (!authReady) {
      return;
    }

    if (!user) {
      router.push("/login");
      return;
    }

    setLoadingPlaylists(true);
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setPlaylists([]);
    setNewPlaylistName("");
    setLoadingPlaylists(false);
    setCreatingPlaylist(false);
    setSavingToPlaylistId(null);
    resetMessages();
  };

  const handleBackdropClick = (
    event: MouseEvent<HTMLDivElement>
  ) => {
    if (event.target === event.currentTarget) {
      handleClose();
    }
  };

  const saveTrackToPlaylist = async (
    playlistId: string
  ) => {
    if (!user) {
      router.push("/login");
      return;
    }

    resetMessages();
    setSavingToPlaylistId(playlistId);

    try {
      const playlistReference = doc(
        db,
        "users",
        user.uid,
        "playlists",
        playlistId
      );

      const playlistTrackReference = doc(
        db,
        "users",
        user.uid,
        "playlists",
        playlistId,
        "tracks",
        track.id
      );

      await setDoc(
        playlistTrackReference,
        {
          id: track.id,
          title: track.title,
          artist: track.artist,
          genre: track.genre,
          audioURL: track.audioURL,
          coverURL: track.coverURL,
          duration: track.duration,
          emotionTags: track.emotionTags,
          addedAt: serverTimestamp(),
        },
        {
          merge: true,
        }
      );

      await updateDoc(playlistReference, {
        updatedAt: serverTimestamp(),
      });

      setSuccessMessage(
        `"${track.title}" has been added to your playlist.`
      );
    } catch (saveError) {
      console.error(
        "Could not add track to playlist:",
        saveError
      );

      setError(
        "We couldn't add this track to the playlist. Please try again."
      );
    } finally {
      setSavingToPlaylistId(null);
    }
  };

  const handleCreatePlaylist = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!user) {
      router.push("/login");
      return;
    }

    const cleanedName = newPlaylistName.trim();

    if (!cleanedName) {
      setError("Please enter a playlist name.");
      return;
    }

    resetMessages();
    setCreatingPlaylist(true);

    try {
      const playlistsReference = collection(
        db,
        "users",
        user.uid,
        "playlists"
      );

      const newPlaylistReference = await addDoc(
        playlistsReference,
        {
          name: cleanedName,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }
      );

      const playlistTrackReference = doc(
        db,
        "users",
        user.uid,
        "playlists",
        newPlaylistReference.id,
        "tracks",
        track.id
      );

      await setDoc(playlistTrackReference, {
        id: track.id,
        title: track.title,
        artist: track.artist,
        genre: track.genre,
        audioURL: track.audioURL,
        coverURL: track.coverURL,
        duration: track.duration,
        emotionTags: track.emotionTags,
        addedAt: serverTimestamp(),
      });

      await updateDoc(newPlaylistReference, {
        updatedAt: serverTimestamp(),
      });

      setNewPlaylistName("");

      setSuccessMessage(
        `"${cleanedName}" was created and "${track.title}" was added.`
      );
    } catch (createError) {
      console.error(
        "Could not create playlist:",
        createError
      );

      setError(
        "We couldn't create the playlist. Please try again."
      );
    } finally {
      setCreatingPlaylist(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className="add-to-playlist-button"
        onClick={handleOpen}
        disabled={!authReady}
        aria-label={`Add ${track.title} to a playlist`}
        title="Add to playlist"
      >
        <span aria-hidden="true">＋</span>
        <span>Add to playlist</span>
      </button>

      {isOpen ? (
        <div
          className="playlist-modal-backdrop"
          role="presentation"
          onMouseDown={handleBackdropClick}
        >
          <section
            className="playlist-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="playlist-modal-title"
          >
            <header className="playlist-modal-header">
              <div>
                <p className="playlist-modal-eyebrow">
                  Your music
                </p>

                <h2 id="playlist-modal-title">
                  Add to playlist
                </h2>

                <p>
                  Choose an existing playlist or
                  create a new one for “{track.title}”.
                </p>
              </div>

              <button
                type="button"
                className="playlist-modal-close"
                onClick={handleClose}
                aria-label="Close playlist window"
              >
                ×
              </button>
            </header>

            <form
              className="playlist-create-form"
              onSubmit={handleCreatePlaylist}
            >
              <label
                htmlFor={`playlist-name-${track.id}`}
              >
                Create a new playlist
              </label>

              <div className="playlist-create-controls">
                <input
                  id={`playlist-name-${track.id}`}
                  type="text"
                  value={newPlaylistName}
                  onChange={(event) => {
                    setNewPlaylistName(
                      event.target.value
                    );

                    if (error) {
                      setError("");
                    }
                  }}
                  placeholder="Playlist name"
                  maxLength={60}
                  autoComplete="off"
                />

                <button
                  type="submit"
                  disabled={
                    creatingPlaylist ||
                    !newPlaylistName.trim()
                  }
                >
                  {creatingPlaylist
                    ? "Creating..."
                    : "Create"}
                </button>
              </div>
            </form>

            <div className="playlist-existing-section">
              <h3>Your playlists</h3>

              {loadingPlaylists ? (
                <p className="playlist-modal-status">
                  Loading playlists...
                </p>
              ) : null}

              {!loadingPlaylists &&
              playlists.length === 0 ? (
                <p className="playlist-modal-status">
                  You do not have any playlists yet.
                  Create your first one above.
                </p>
              ) : null}

              {!loadingPlaylists &&
              playlists.length > 0 ? (
                <div className="playlist-choice-list">
                  {playlists.map((playlist) => {
                    const isSaving =
                      savingToPlaylistId ===
                      playlist.id;

                    return (
                      <button
                        key={playlist.id}
                        type="button"
                        className="playlist-choice"
                        onClick={() => {
                          void saveTrackToPlaylist(
                            playlist.id
                          );
                        }}
                        disabled={
                          savingToPlaylistId !==
                            null ||
                          creatingPlaylist
                        }
                      >
                        <span
                          className="playlist-choice-icon"
                          aria-hidden="true"
                        >
                          ♫
                        </span>

                        <span className="playlist-choice-name">
                          {playlist.name}
                        </span>

                        <span
                          className="playlist-choice-action"
                          aria-hidden="true"
                        >
                          {isSaving
                            ? "Saving..."
                            : "Add →"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>

            {error ? (
              <p
                className="playlist-modal-error"
                role="alert"
              >
                {error}
              </p>
            ) : null}

            {successMessage ? (
              <p
                className="playlist-modal-success"
                role="status"
              >
                {successMessage}
              </p>
            ) : null}
          </section>
        </div>
      ) : null}
    </>
  );
}