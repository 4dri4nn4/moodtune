"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import type { ChangeEvent } from "react";

import useFavourite from "@/components/favourites/useFavourite";
import { usePlayer } from "@/components/player/PlayerProvider";

export default function MiniPlayer() {
  const router = useRouter();

  const {
    queue,
    currentTrack,
    journey,
    emotion,
    isPlaying,
    isMinimized,
    volume,
    isMuted,
    togglePlay,
    playPrevious,
    playNext,
    setVolume,
    toggleMute,
    expandPlayer,
  } = usePlayer();

  const {
    isFavourite,
    updatingFavourite,
    toggleFavourite,
  } = useFavourite(currentTrack);

  if (!currentTrack || !isMinimized) {
    return null;
  }

  const track = currentTrack;
  const volumePercentage = Math.round(volume * 100);

  const volumeIcon =
    isMuted || volume === 0
      ? "🔇"
      : volume < 0.5
        ? "🔉"
        : "🔊";

  function handleExpand() {
    expandPlayer();

    const parameters = new URLSearchParams({
      track: track.id,
    });

    if (journey) {
      parameters.set("journey", journey);
    }

    if (emotion) {
      parameters.set("emotion", emotion);
    }

    router.push(`/player?${parameters.toString()}`);
  }

  function handleVolumeChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    setVolume(Number(event.target.value));
  }

  return (
    <aside
      className="mini-player"
      aria-label="Minimized music player"
    >
      <button
        type="button"
        className="mini-player-track"
        onClick={handleExpand}
        aria-label={`Open full player for ${track.title}`}
      >
        {track.coverURL === "pending" ? (
          <span className="mini-player-cover-placeholder">
            ♪
          </span>
        ) : (
          <Image
            src={track.coverURL}
            alt=""
            width={56}
            height={56}
            className="mini-player-cover"
          />
        )}

        <span className="mini-player-details">
          <strong>{track.title}</strong>
          <span>{track.artist}</span>
        </span>
      </button>

      <div
        className="mini-player-volume"
        aria-label="Volume controls"
      >
        <button
          type="button"
          className="mini-player-mute-button"
          onClick={toggleMute}
          aria-label={
            isMuted
              ? "Unmute audio"
              : "Mute audio"
          }
          aria-pressed={isMuted}
          title={isMuted ? "Unmute" : "Mute"}
        >
          <span aria-hidden="true">
            {volumeIcon}
          </span>
        </button>

        <label
          htmlFor="mini-player-volume-slider"
          className="sr-only"
        >
          Player volume
        </label>

        <input
          id="mini-player-volume-slider"
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={handleVolumeChange}
          aria-label="Mini-player volume"
          aria-valuetext={
            isMuted
              ? "Muted"
              : `${volumePercentage} percent`
          }
        />
      </div>

      <div className="mini-player-controls">
        <button
          type="button"
          className={
            isFavourite
              ? "mini-player-favourite-button favourite-active"
              : "mini-player-favourite-button"
          }
          onClick={() => {
            void toggleFavourite();
          }}
          disabled={updatingFavourite}
          aria-label={
            isFavourite
              ? `Remove ${track.title} from favourites`
              : `Add ${track.title} to favourites`
          }
          aria-pressed={isFavourite}
          title={
            isFavourite
              ? "Remove from favourites"
              : "Add to favourites"
          }
        >
          {updatingFavourite
            ? "…"
            : isFavourite
              ? "♥"
              : "♡"}
        </button>

        <button
          type="button"
          onClick={playPrevious}
          disabled={queue.length < 2}
          aria-label="Previous track"
        >
          ◀
        </button>

        <button
          type="button"
          className="mini-player-main-button"
          onClick={() => {
            void togglePlay();
          }}
          aria-label={
            isPlaying ? "Pause" : "Play"
          }
        >
          {isPlaying ? "❚❚" : "▶"}
        </button>

        <button
          type="button"
          onClick={playNext}
          disabled={queue.length < 2}
          aria-label="Next track"
        >
          ▶
        </button>

        <button
          type="button"
          className="mini-player-expand-button"
          onClick={handleExpand}
          aria-label="Open full player"
          title="Open full player"
        >
          ⤢
        </button>
      </div>
    </aside>
  );
}