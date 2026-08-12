"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import {
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";

import {
  doc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import { auth, db } from "@/lib/firebase";
import MoodTuneLogo from "@/components/ui/MoodTuneLogo";

export default function RegisterPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    if (!username.trim()) {
      setError("Please choose a username.");
      return;
    }

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    if (password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const userCredential =
        await createUserWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );

      await updateProfile(userCredential.user, {
        displayName: username.trim(),
      });

      await setDoc(
        doc(db, "users", userCredential.user.uid),
        {
          username: username.trim(),
          email: userCredential.user.email,
          createdAt: serverTimestamp(),
        }
      );

      router.push("/profile");
    } catch (error: unknown) {
      console.error("Registration error:", error);

      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error
      ) {
        const firebaseError = error as {
          code: string;
        };

        if (
          firebaseError.code ===
          "auth/email-already-in-use"
        ) {
          setError(
            "An account already exists with this email address."
          );
        } else if (
          firebaseError.code === "auth/invalid-email"
        ) {
          setError(
            "Please enter a valid email address."
          );
        } else if (
          firebaseError.code === "auth/weak-password"
        ) {
          setError(
            "Please choose a stronger password."
          );
        } else if (
          firebaseError.code === "permission-denied"
        ) {
          setError(
            "Your account was created, but the profile could not be saved."
          );
        } else {
          setError(
            "We couldn't create your account. Please try again."
          );
        }
      } else {
        setError(
          "We couldn't create your account. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-brand">
        <MoodTuneLogo size={62} />

        <div className="auth-brand-name">
          Mood<span>Tune</span>
        </div>

        <p>Every emotion has a soundtrack.</p>
      </div>

      <section className="auth-card">
        <div className="auth-heading">
          <p className="eyebrow auth-eyebrow">
            START YOUR JOURNEY
          </p>

          <h1>
            Create your
            <br />
            Mood<span>Tune</span> account
          </h1>

          <p className="auth-description">
            Create your profile and begin your personalised listening journey.
          </p>
        </div>

        <form
          className="auth-form"
          onSubmit={handleRegister}
        >
          <div className="form-group">
            <label htmlFor="username">
              Username
            </label>

            <div className="auth-input-wrap">
              <span className="auth-input-icon">
                ♡
              </span>

              <input
                id="username"
                name="username"
                type="text"
                placeholder="Choose a username"
                autoComplete="username"
                value={username}
                onChange={(event) =>
                  setUsername(event.target.value)
                }
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email">
              Email address
            </label>

            <div className="auth-input-wrap">
              <span className="auth-input-icon">
                ✉
              </span>

              <input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                autoComplete="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">
              Password
            </label>

            <div className="auth-input-wrap">
              <span className="auth-input-icon">
                ♢
              </span>

              <input
                id="password"
                name="password"
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                placeholder="Create a password"
                autoComplete="new-password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() =>
                  setShowPassword(
                    (current) => !current
                  )
                }
                aria-label={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
              >
                ◉
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">
              Confirm password
            </label>

            <div className="auth-input-wrap">
              <span className="auth-input-icon">
                ♢
              </span>

              <input
                id="confirmPassword"
                name="confirmPassword"
                type={
                  showConfirmPassword
                    ? "text"
                    : "password"
                }
                placeholder="Confirm your password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(
                    event.target.value
                  )
                }
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() =>
                  setShowConfirmPassword(
                    (current) => !current
                  )
                }
                aria-label={
                  showConfirmPassword
                    ? "Hide password"
                    : "Show password"
                }
              >
                ◉
              </button>
            </div>
          </div>

          {error && (
            <p
              style={{
                margin: 0,
                color: "#ff72c8",
                fontSize: "0.8rem",
                lineHeight: 1.4,
              }}
            >
              {error}
            </p>
          )}

          <button
            className="auth-button"
            type="submit"
            disabled={loading}
          >
            <span>
              {loading
                ? "Creating account..."
                : "Create account"}
            </span>

            {!loading && <span>→</span>}
          </button>
        </form>

        <div className="auth-divider">
          <span />
          <p>OR</p>
          <span />
        </div>

        <p className="auth-switch">
          Already have an account?{" "}
          <Link href="/login">
            Sign in
          </Link>
        </p>
      </section>

      <Link
        className="auth-home-link"
        href="/"
      >
        ← Back to home
      </Link>
    </main>
  );
}