"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useRouter,
} from "next/navigation";
import {
  useEffect,
  useState,
  type ChangeEvent,
} from "react";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import MoodTuneLogo from "@/components/ui/MoodTuneLogo";
import useFavourite from "@/components/favourites/useFavourite";
import {
  usePlayer,
  type Track,
} from "@/components/player/PlayerProvider";

type PlayerViewProps = {
  trackId: string;
  journey: string;
  emotion: string;
};

export default function PlayerView({
  trackId,
  journey,
  emotion,
}: PlayerViewProps) {
  const router = useRouter();

  const {
    queue,
    currentTrack,
    currentIndex,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isShuffle,
    repeatMode,
    error: playerError,
    loadQueue,
    togglePlay,
    playNext,
    playPrevious,
    seek,
    setVolume,
    toggleMute,
    toggleShuffle,
    cycleRepeatMode,
    minimizePlayer,
  } = usePlayer();

  const {
    isFavourite,
    updatingFavourite,
    favouriteError,
    toggleFavourite,
  } = useFavourite(currentTrack);

  const [loading, setLoading] =
    useState(true);

  const [pageError, setPageError] =
    useState("");

  useEffect(() => {
    let active = true;

    async function preparePlayer() {
      if (!trackId) {
        setPageError(
          "No track was selected."
        );

        setLoading(false);
        return;
      }

      if (
        currentTrack?.id === trackId &&
        queue.length > 0
      ) {
        setPageError("");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setPageError("");

        if (emotion) {
          const tracksQuery = query(
            collection(db, "tracks"),
            where(
              "emotionTags",
              "array-contains",
              emotion
            )
          );

          const snapshot =
            await getDocs(tracksQuery);

          if (!active) {
            return;
          }

          const matchingTracks: Track[] =
            snapshot.docs.map(
              (trackDocument) => ({
                id: trackDocument.id,
                ...(
                  trackDocument.data() as Omit<
                    Track,
                    "id"
                  >
                ),
              })
            );

          if (
            !matchingTracks.some(
              (track) =>
                track.id === trackId
            )
          ) {
            setPageError(
              "This track is not available in the selected playlist."
            );

            return;
          }

          loadQueue(
            matchingTracks,
            trackId,
            {
              journey,
              emotion,
            }
          );

          return;
        }

        const snapshot = await getDoc(
          doc(db, "tracks", trackId)
        );

        if (!active) {
          return;
        }

        if (!snapshot.exists()) {
          setPageError(
            "This track could not be found."
          );

          return;
        }

        const selectedTrack: Track = {
          id: snapshot.id,
          ...(
            snapshot.data() as Omit<
              Track,
              "id"
            >
          ),
        };

        loadQueue(
          [selectedTrack],
          trackId,
          {
            journey,
            emotion,
          }
        );
      } catch (trackError) {
        console.error(
          "Player loading error:",
          trackError
        );

        if (active) {
          setPageError(
            "We couldn't load this track."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void preparePlayer();

    return () => {
      active = false;
    };
  }, [
    currentTrack?.id,
    emotion,
    journey,
    loadQueue,
    queue.length,
    trackId,
  ]);

  useEffect(() => {
    if (
      !currentTrack ||
      currentTrack.id === trackId
    ) {
      return;
    }

    const parameters =
      new URLSearchParams({
        track: currentTrack.id,
        journey,
      });

    if (emotion) {
      parameters.set(
        "emotion",
        emotion
      );
    }

    router.replace(
      `/player?${parameters.toString()}`,
      {
        scroll: false,
      }
    );
  }, [
    currentTrack,
    emotion,
    journey,
    router,
    trackId,
  ]);

  function handleMinimize() {
    minimizePlayer();

    if (
      journey === "library" ||
      journey === "playlist"
    ) {
      router.push("/library");
      return;
    }

    if (!emotion) {
      router.push(
        `/browse?journey=${
          journey === "want"
            ? "want"
            : "feel"
        }`
      );

      return;
    }

    const parameters =
      new URLSearchParams({
        journey,
        emotion,
      });

    router.push(
      `/results?${parameters.toString()}`
    );
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
    )
      .toString()
      .padStart(2, "0");

    return `${minutes}:${remainingSeconds}`;
  }

  const visibleError =
    pageError || playerError;

  const cameFromLibrary =
    journey === "library" ||
    journey === "playlist";

  const returnHref = cameFromLibrary
    ? "/library"
    : `/browse?journey=${
        journey === "want"
          ? "want"
          : "feel"
      }`;

  const returnLabel = cameFromLibrary
    ? "← Back to your Library"
    : "← Choose another emotion";

  const volumePercentage = Math.round(
    volume * 100
  );

  const volumeIcon =
    isMuted || volume === 0
      ? "🔇"
      : volume < 0.5
        ? "🔉"
        : "🔊";

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
        {!loading &&
        !visibleError &&
        currentTrack ? (
          <div className="player-panel-actions">
            <button
              type="button"
              className={
                isFavourite
                  ? "player-favourite-button favourite-active"
                  : "player-favourite-button"
              }
              onClick={() => {
                void toggleFavourite();
              }}
              disabled={updatingFavourite}
              aria-label={
                isFavourite
                  ? `Remove ${currentTrack.title} from favourites`
                  : `Add ${currentTrack.title} to favourites`
              }
              aria-pressed={isFavourite}
            >
              <span aria-hidden="true">
                {updatingFavourite
                  ? "…"
                  : isFavourite
                    ? "♥"
                    : "♡"}
              </span>

              <span>
                {isFavourite
                  ? "Saved"
                  : "Add to favourites"}
              </span>
            </button>

            <button
              type="button"
              className="player-minimize-button"
              onClick={handleMinimize}
              aria-label="Minimize player"
            >
              <span aria-hidden="true">
                ─
              </span>

              <span>
                Minimize player
              </span>
            </button>
          </div>
        ) : null}

        <div className="emotion-heading">
          <p className="eyebrow auth-eyebrow">
            NOW PLAYING
          </p>

          {loading ? (
            <h1>
              Loading your track...
            </h1>
          ) : null}

          {visibleError ? (
            <>
              <h1>
                Something went wrong
              </h1>

              <p>{visibleError}</p>
            </>
          ) : null}

          {!loading &&
          !visibleError &&
          currentTrack ? (
            <>
              <h1>Your soundtrack</h1>

              <p>
                Listen, move through the
                playlist, save favourites,
                shuffle or repeat tracks,
                adjust the volume, or
                minimize the player while
                browsing.
              </p>
            </>
          ) : null}
        </div>

        {favouriteError ? (
          <p
            className="results-error player-favourite-error"
            role="alert"
          >
            {favouriteError}
          </p>
        ) : null}

        {!loading &&
        !visibleError &&
        currentTrack ? (
          <div className="player-card">
            <div className="player-artwork">
              {currentTrack.coverURL ===
              "pending" ? (
                <div className="player-artwork-placeholder">
                  ♪
                </div>
              ) : (
                <Image
                  src={
                    currentTrack.coverURL
                  }
                  alt={`${currentTrack.title} cover`}
                  width={220}
                  height={220}
                  priority
                />
              )}
            </div>

            <div className="player-track-info">
              <p className="result-genre">
                {currentTrack.genre}
              </p>

              <h2>
                {currentTrack.title}
              </h2>

              <p>
                {currentTrack.artist}
              </p>

              <div className="player-tags">
                {currentTrack.emotionTags?.map(
                  (tag) => (
                    <span key={tag}>
                      {tag}
                    </span>
                  )
                )}
              </div>

              {queue.length > 1 ? (
                <p className="player-queue-position">
                  Track {currentIndex + 1}{" "}
                  of {queue.length}
                </p>
              ) : null}
            </div>

            <div className="player-progress">
              <input
                type="range"
                min="0"
                max={duration || 0}
                value={currentTime}
                step="0.1"
                onChange={(
                  event: ChangeEvent<HTMLInputElement>
                ) =>
                  seek(
                    Number(
                      event.target.value
                    )
                  )
                }
                aria-label="Track progress"
              />

              <div className="player-time">
                <span>
                  {formatTime(currentTime)}
                </span>

                <span>
                  {formatTime(duration)}
                </span>
              </div>
            </div>

            <div className="player-volume-control">
              <button
                type="button"
                className="player-mute-button"
                onClick={toggleMute}
                aria-label={
                  isMuted
                    ? "Unmute audio"
                    : "Mute audio"
                }
                aria-pressed={isMuted}
                title={
                  isMuted
                    ? "Unmute"
                    : "Mute"
                }
              >
                <span aria-hidden="true">
                  {volumeIcon}
                </span>
              </button>

              <label htmlFor="player-volume">
                Volume
              </label>

              <input
                id="player-volume"
                type="range"
                min="0"
                max="1"
                value={volume}
                step="0.01"
                onChange={(
                  event: ChangeEvent<HTMLInputElement>
                ) =>
                  setVolume(
                    Number(
                      event.target.value
                    )
                  )
                }
                aria-label="Player volume"
                aria-valuetext={
                  isMuted
                    ? "Muted"
                    : `${volumePercentage} percent`
                }
              />

              <output
                htmlFor="player-volume"
                aria-live="polite"
              >
                {isMuted
                  ? "Muted"
                  : `${volumePercentage}%`}
              </output>
            </div>

            <div
              className="player-playback-modes"
              aria-label="Playback modes"
            >
              <button
                type="button"
                className={
                  isShuffle
                    ? "player-mode-button mode-active"
                    : "player-mode-button"
                }
                onClick={toggleShuffle}
                aria-label={
                  isShuffle
                    ? "Turn shuffle off"
                    : "Turn shuffle on"
                }
                aria-pressed={isShuffle}
                title={
                  isShuffle
                    ? "Shuffle on"
                    : "Shuffle off"
                }
              >
                <span aria-hidden="true">
                  ⇄
                </span>
                <span>Shuffle</span>
              </button>

              <button
                type="button"
                className={
                  repeatMode !== "off"
                    ? "player-mode-button mode-active"
                    : "player-mode-button"
                }
                onClick={cycleRepeatMode}
                aria-label={
                  repeatMode === "off"
                    ? "Repeat is off. Select to repeat the queue"
                    : repeatMode === "all"
                      ? "Repeating the queue. Select to repeat one track"
                      : "Repeating one track. Select to turn repeat off"
                }
                title={
                  repeatMode === "off"
                    ? "Repeat off"
                    : repeatMode === "all"
                      ? "Repeat queue"
                      : "Repeat track"
                }
              >
                <span aria-hidden="true">
                  {repeatMode === "one"
                    ? "↻¹"
                    : "↻"}
                </span>
                <span>
                  {repeatMode === "off"
                    ? "Repeat off"
                    : repeatMode === "all"
                      ? "Repeat all"
                      : "Repeat one"}
                </span>
              </button>
            </div>

            <div className="player-controls">
              <button
                type="button"
                onClick={playPrevious}
                disabled={
                  queue.length < 2
                }
                aria-label="Previous track"
              >
                ◀
              </button>

              <button
                type="button"
                className="player-main-button"
                onClick={() => {
                  void togglePlay();
                }}
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
                onClick={playNext}
                disabled={
                  queue.length < 2
                }
                aria-label="Next track"
              >
                ▶
              </button>
            </div>
          </div>
        ) : null}

        <Link
          href={returnHref}
          className="auth-home-link results-back-link"
        >
          {returnLabel}
        </Link>
      </section>
    </main>
  );
}
