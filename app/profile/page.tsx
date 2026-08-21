"use client";

import Link from "next/link";
import {
  type FormEvent,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  onAuthStateChanged,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import {
  doc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import { auth, db } from "@/lib/firebase";
import MoodTuneLogo from "@/components/ui/MoodTuneLogo";

export default function ProfilePage() {
  const router = useRouter();

  const [user, setUser] =
    useState<User | null>(null);

  const [savedUsername, setSavedUsername] =
    useState("");

  const [editedUsername, setEditedUsername] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [editing, setEditing] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [signingOut, setSigningOut] =
    useState(false);

  const [error, setError] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        if (!currentUser) {
          router.replace("/login");
          return;
        }

        const currentUsername =
          currentUser.displayName?.trim() ||
          "Listener";

        setUser(currentUser);
        setSavedUsername(currentUsername);
        setEditedUsername(currentUsername);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [router]);

  function startEditing() {
    setEditedUsername(savedUsername);
    setError("");
    setSuccessMessage("");
    setEditing(true);
  }

  function cancelEditing() {
    setEditedUsername(savedUsername);
    setError("");
    setEditing(false);
  }

  async function handleSaveUsername(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!user || saving) {
      return;
    }

    const cleanedUsername =
      editedUsername.trim();

    setError("");
    setSuccessMessage("");

    if (!cleanedUsername) {
      setError(
        "Please enter a username."
      );
      return;
    }

    if (cleanedUsername.length < 2) {
      setError(
        "Your username must contain at least 2 characters."
      );
      return;
    }

    if (cleanedUsername.length > 30) {
      setError(
        "Your username cannot contain more than 30 characters."
      );
      return;
    }

    if (
      !/^[a-zA-Z0-9 _-]+$/.test(
        cleanedUsername
      )
    ) {
      setError(
        "Your username can only contain letters, numbers, spaces, hyphens and underscores."
      );
      return;
    }

    if (cleanedUsername === savedUsername) {
      setEditing(false);
      return;
    }

    try {
      setSaving(true);

      await updateProfile(user, {
        displayName: cleanedUsername,
      });

      await setDoc(
        doc(db, "users", user.uid),
        {
          username: cleanedUsername,
          email: user.email ?? "",
          updatedAt: serverTimestamp(),
        },
        {
          merge: true,
        }
      );

      setSavedUsername(cleanedUsername);
      setEditedUsername(cleanedUsername);
      setEditing(false);

      setSuccessMessage(
        "Your username has been updated successfully."
      );
    } catch (saveError) {
      console.error(
        "Profile update error:",
        saveError
      );

      setError(
        "We couldn't update your username. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    if (signingOut) {
      return;
    }

    try {
      setSigningOut(true);
      setError("");
      setSuccessMessage("");

      await signOut(auth);

      router.replace("/login");
    } catch (signOutError) {
      console.error(
        "Sign out error:",
        signOutError
      );

      setError(
        "We couldn't sign you out. Please try again."
      );

      setSigningOut(false);
    }
  }

  if (loading) {
    return (
      <main className="auth-page">
        <p>
          Loading your MoodTune profile...
        </p>
      </main>
    );
  }

  return (
    <main className="auth-page">
      <div className="auth-brand">
        <MoodTuneLogo size={62} />

        <div className="auth-brand-name">
          Mood<span>Tune</span>
        </div>

        <p>
          Every emotion has a soundtrack.
        </p>
      </div>

      <section className="auth-card profile-card">
        <div className="auth-heading">
          <p className="eyebrow auth-eyebrow">
            YOUR MOODTUNE
          </p>

          <h1>
            Welcome,
            <br />

            <span>{savedUsername}</span>
          </h1>

          <p className="auth-description">
            Your personal space for your
            MoodTune journey.
          </p>
        </div>

        <div className="profile-details">
          <div className="profile-detail profile-username-detail">
            <div className="profile-detail-heading">
              <span className="profile-label">
                Username
              </span>

              {!editing ? (
                <button
                  type="button"
                  className="profile-edit-button"
                  onClick={startEditing}
                >
                  Edit
                </button>
              ) : null}
            </div>

            {!editing ? (
              <strong>
                {savedUsername}
              </strong>
            ) : (
              <form
                className="profile-edit-form"
                onSubmit={
                  handleSaveUsername
                }
              >
                <label
                  htmlFor="profile-username"
                  className="sr-only"
                >
                  New username
                </label>

                <input
                  id="profile-username"
                  type="text"
                  value={editedUsername}
                  onChange={(event) => {
                    setEditedUsername(
                      event.target.value
                    );

                    if (error) {
                      setError("");
                    }
                  }}
                  minLength={2}
                  maxLength={30}
                  autoComplete="username"
                  autoFocus
                />

                <div className="profile-edit-actions">
                  <button
                    type="submit"
                    className="profile-save-button"
                    disabled={
                      saving ||
                      !editedUsername.trim()
                    }
                  >
                    {saving
                      ? "Saving..."
                      : "Save"}
                  </button>

                  <button
                    type="button"
                    className="profile-cancel-button"
                    onClick={cancelEditing}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>

          <div className="profile-detail">
            <span className="profile-label">
              Email address
            </span>

            <strong>
              {user?.email ||
                "Not available"}
            </strong>
          </div>
        </div>

        {error ? (
          <p
            className="profile-feedback profile-error"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        {successMessage ? (
          <p
            className="profile-feedback profile-success"
            role="status"
          >
            {successMessage}
          </p>
        ) : null}

        <div className="profile-actions">
          <Link
            href="/"
            className="auth-button profile-home-button"
          >
            <span>
              Back to MoodTune
            </span>

            <span>→</span>
          </Link>

          <button
            type="button"
            className="profile-signout-button"
            onClick={() => {
              void handleSignOut();
            }}
            disabled={signingOut}
          >
            {signingOut
              ? "Signing out..."
              : "Sign out"}
          </button>
        </div>
      </section>
    </main>
  );
}