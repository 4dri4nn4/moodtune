"use client";

import Link from "next/link";
import { useEffect, useState, type ChangeEvent } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";

import { auth } from "@/lib/firebase";
import MoodTuneLogo from "@/components/ui/MoodTuneLogo";
import { usePlayer } from "@/components/player/PlayerProvider";

export default function SettingsPage() {
  const {
    volume,
    isMuted,
    isShuffle,
    repeatMode,
    setVolume,
    toggleMute,
    toggleShuffle,
    cycleRepeatMode,
  } = usePlayer();

  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [resetMessage, setResetMessage] = useState("");

  useEffect(() => {
    return onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthReady(true);
    });
  }, []);

  function handleVolumeChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    setResetMessage("");
    setVolume(Number(event.target.value));
  }

  function handleReset() {
    setVolume(0.8);

    if (isShuffle) {
      toggleShuffle();
    }

    if (repeatMode === "all") {
      cycleRepeatMode();
      cycleRepeatMode();
    } else if (repeatMode === "one") {
      cycleRepeatMode();
    }

    setResetMessage(
      "Playback preferences were reset to the MoodTune defaults."
    );
  }

  const volumePercentage = Math.round(volume * 100);
  const volumeIcon =
    isMuted || volume === 0
      ? "🔇"
      : volume < 0.5
        ? "🔉"
        : "🔊";

  const repeatLabel =
    repeatMode === "off"
      ? "Repeat off"
      : repeatMode === "all"
        ? "Repeat all"
        : "Repeat one";

  return (
    <main className="auth-page settings-page">
      <div className="auth-brand">
        <MoodTuneLogo size={62} />
        <div className="auth-brand-name">
          Mood<span>Tune</span>
        </div>
        <p>Every emotion has a soundtrack.</p>
      </div>

      <section className="auth-card settings-card">
        <div className="auth-heading">
          <p className="eyebrow auth-eyebrow">
            YOUR EXPERIENCE
          </p>
          <h1>Settings</h1>
          <p className="auth-description">
            Manage playback preferences for this browser.
            Changes are saved automatically.
          </p>
        </div>

        <div className="settings-sections">
          <section
            className="settings-section"
            aria-labelledby="playback-settings-title"
          >
            <div className="settings-section-heading">
              <div>
                <p className="settings-kicker">PLAYBACK</p>
                <h2 id="playback-settings-title">
                  Audio preferences
                </h2>
              </div>
              <span className="settings-saved-badge">
                Saved automatically
              </span>
            </div>

            <div className="settings-control">
              <div className="settings-control-copy">
                <strong>Volume</strong>
                <span>
                  Choose the default listening level.
                </span>
              </div>

              <div className="settings-volume-control">
                <button
                  type="button"
                  className="settings-icon-button"
                  onClick={() => {
                    setResetMessage("");
                    toggleMute();
                  }}
                  aria-label={isMuted ? "Unmute audio" : "Mute audio"}
                  aria-pressed={isMuted}
                >
                  <span aria-hidden="true">{volumeIcon}</span>
                </button>

                <label htmlFor="settings-volume" className="sr-only">
                  Playback volume
                </label>
                <input
                  id="settings-volume"
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={handleVolumeChange}
                  aria-valuetext={
                    isMuted
                      ? "Muted"
                      : `${volumePercentage} percent`
                  }
                />
                <output htmlFor="settings-volume">
                  {isMuted ? "Muted" : `${volumePercentage}%`}
                </output>
              </div>
            </div>

            <div className="settings-control">
              <div className="settings-control-copy">
                <strong>Shuffle</strong>
                <span>Randomize the current playback queue.</span>
              </div>
              <button
                type="button"
                className={
                  isShuffle
                    ? "settings-choice-button setting-active"
                    : "settings-choice-button"
                }
                onClick={() => {
                  setResetMessage("");
                  toggleShuffle();
                }}
                aria-pressed={isShuffle}
              >
                <span aria-hidden="true">⇄</span>
                <span>{isShuffle ? "On" : "Off"}</span>
              </button>
            </div>

            <div className="settings-control">
              <div className="settings-control-copy">
                <strong>Repeat mode</strong>
                <span>Repeat no tracks, the queue or one track.</span>
              </div>
              <button
                type="button"
                className={
                  repeatMode === "off"
                    ? "settings-choice-button"
                    : "settings-choice-button setting-active"
                }
                onClick={() => {
                  setResetMessage("");
                  cycleRepeatMode();
                }}
                title="Change repeat mode"
              >
                <span aria-hidden="true">
                  {repeatMode === "one" ? "↻¹" : "↻"}
                </span>
                <span>{repeatLabel}</span>
              </button>
            </div>

            <div className="settings-reset-row">
              <button
                type="button"
                className="settings-reset-button"
                onClick={handleReset}
              >
                Reset playback preferences
              </button>
              {resetMessage ? (
                <p role="status">{resetMessage}</p>
              ) : null}
            </div>
          </section>

          <section
            className="settings-section settings-account-section"
            aria-labelledby="account-settings-title"
          >
            <div className="settings-control-copy">
              <p className="settings-kicker">ACCOUNT</p>
              <h2 id="account-settings-title">
                {authReady && user
                  ? "Your MoodTune account"
                  : "Personalize MoodTune"}
              </h2>
              <span>
                {authReady && user
                  ? user.email || "Signed-in MoodTune listener"
                  : "Sign in to save favourites, playlists and listening history."}
              </span>
            </div>

            {authReady ? (
              <Link
                href={user ? "/profile" : "/login"}
                className="settings-account-link"
              >
                {user ? "Open profile" : "Sign in"}
                <span aria-hidden="true">→</span>
              </Link>
            ) : (
              <span className="settings-account-loading">
                Checking account…
              </span>
            )}
          </section>
        </div>

        <Link
          href="/"
          className="auth-home-link settings-home-link"
        >
          ← Back to home
        </Link>
      </section>
    </main>
  );
}

