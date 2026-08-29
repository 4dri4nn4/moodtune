"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signOut,
  type User,
} from "firebase/auth";

import { auth } from "@/lib/firebase";

export default function Home() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState("");

  useEffect(() => {
    return onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser);
        setAuthReady(true);
      }
    );
  }, []);

  async function handleSignOut() {
    try {
      setSigningOut(true);
      setSignOutError("");

      await signOut(auth);

      router.refresh();
    } catch (error) {
      console.error("Sign out error:", error);

      setSignOutError(
        "We couldn't sign you out. Please try again."
      );
    } finally {
      setSigningOut(false);
    }
  }

  const listenerName: string =
    user?.displayName ||
    user?.email ||
    "Listener";

  return (
    <main className="home-page">
      <header className="topbar">
        <Link
          href="/"
          className="brand"
          aria-label="MoodTune home"
        >
          MoodTune
        </Link>

        <nav
          className="topbar-actions"
          aria-label="Main navigation"
        >
          <Link
            href="/browse?journey=feel"
            className="nav-link"
          >
            Browse
          </Link>

          <Link
            href="/library"
            className="nav-link"
          >
            Library
          </Link>

          <Link
            href="/settings"
            className="nav-link"
          >
            Settings
          </Link>

          <Link
            href="/help"
            className="nav-link"
          >
            Help
          </Link>

          {authReady && user && (
            <>
              <span
                className="nav-listener"
                title={
                  user.email ||
                  "Signed-in MoodTune account"
                }
              >
                Hi, {listenerName}
              </span>

              <Link
                href="/profile"
                className="nav-link"
              >
                Profile
              </Link>

              <button
                type="button"
                className="nav-signout-button"
                onClick={handleSignOut}
                disabled={signingOut}
              >
                {signingOut
                  ? "Signing out..."
                  : "Sign out"}
              </button>
            </>
          )}

          {authReady && !user && (
            <>
              <Link
                href="/login"
                className="nav-link"
              >
                Sign in
              </Link>

              <Link
                href="/register"
                className="button button-small"
              >
                Create account
              </Link>
            </>
          )}

          {!authReady && (
            <span
              className="nav-auth-loading"
              aria-label="Checking account"
            >
              •••
            </span>
          )}
        </nav>
      </header>

      {signOutError && (
        <p
          className="home-auth-error"
          role="alert"
        >
          {signOutError}
        </p>
      )}

      <section className="hero">
        <p className="eyebrow">
          Emotion-aware music streaming
        </p>

        <h1>
          Every emotion has a soundtrack.
        </h1>

        <p className="hero-description">
          Discover and play music based on how you feel
          now, or how you want to feel next.
        </p>

        <div className="journey-grid">
          <Link
            href="/browse?journey=feel"
            className="journey-card"
          >
            <span className="journey-label">
              Current mood
            </span>

            <strong>
              I feel...
            </strong>

            <span>
              Choose music that reflects your emotions.
            </span>
          </Link>

          <Link
            href="/browse?journey=want"
            className="journey-card"
          >
            <span className="journey-label">
              Desired mood
            </span>

            <strong>
              I want to feel...
            </strong>

            <span>
              Choose music that helps guide your mood.
            </span>
          </Link>
        </div>

        <div className="hero-actions">
          <Link
            href="/browse?journey=feel"
            className="button"
          >
            Browse music
          </Link>

          {authReady && user ? (
            <Link
              href="/library"
              className="text-link"
            >
              Open your saved music
            </Link>
          ) : (
            <Link
              href="/register"
              className="text-link"
            >
              Start your MoodTune journey
            </Link>
          )}
        </div>
      </section>

      <section
        className="feature-section"
        aria-labelledby="features-title"
      >
        <div className="section-heading">
          <p className="eyebrow">
            Designed around you
          </p>

          <h2 id="features-title">
            Music discovery that begins with emotion
          </h2>
        </div>

        <div className="feature-grid">
          <Link
            href="/browse?journey=feel"
            className="feature-card feature-card-link"
          >
            <h3>
              Emotion selection
            </h3>

            <p>
              Select your current or desired mood and
              discover matching music.
            </p>

            <span className="feature-card-action">
              Choose an emotion →
            </span>
          </Link>

          <Link
            href="/library"
            className="feature-card feature-card-link"
          >
            <h3>
              Your own library
            </h3>

            <p>
              Save favourites, manage playlists and
              revisit listening history.
            </p>

            <span className="feature-card-action">
              Open your library →
            </span>
          </Link>

          <article className="feature-card">
            <h3>
              Built-in playback
            </h3>

            <p>
              Listen directly inside MoodTune using
              the integrated music player.
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}
