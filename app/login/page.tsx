"use client";

import Link from "next/link";
import {
  type FormEvent,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
} from "firebase/auth";

import { auth } from "@/lib/firebase";
import MoodTuneLogo from "@/components/ui/MoodTuneLogo";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [error, setError] = useState("");
  const [resetMessage, setResetMessage] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [resetLoading, setResetLoading] =
    useState(false);

  async function handleLogin(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setResetMessage("");

    const cleanedEmail = email.trim();

    if (!cleanedEmail) {
      setError(
        "Please enter your email address."
      );
      return;
    }

    if (!password) {
      setError(
        "Please enter your password."
      );
      return;
    }

    try {
      setLoading(true);

      await signInWithEmailAndPassword(
        auth,
        cleanedEmail,
        password
      );

      router.push("/profile");
    } catch (loginError: unknown) {
      console.error(
        "Login error:",
        loginError
      );

      if (
        typeof loginError === "object" &&
        loginError !== null &&
        "code" in loginError
      ) {
        const firebaseError =
          loginError as {
            code: string;
          };

        if (
          firebaseError.code ===
            "auth/invalid-credential" ||
          firebaseError.code ===
            "auth/wrong-password" ||
          firebaseError.code ===
            "auth/user-not-found"
        ) {
          setError(
            "Incorrect email or password."
          );
        } else if (
          firebaseError.code ===
          "auth/invalid-email"
        ) {
          setError(
            "Please enter a valid email address."
          );
        } else if (
          firebaseError.code ===
          "auth/too-many-requests"
        ) {
          setError(
            "Too many login attempts. Please wait a moment and try again."
          );
        } else if (
          firebaseError.code ===
          "auth/network-request-failed"
        ) {
          setError(
            "Please check your internet connection and try again."
          );
        } else {
          setError(
            "We couldn't sign you in. Please try again."
          );
        }
      } else {
        setError(
          "We couldn't sign you in. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  async function handlePasswordReset() {
    setError("");
    setResetMessage("");

    const cleanedEmail = email.trim();

    if (!cleanedEmail) {
      setError(
        "Enter your email address above, then select Forgot password."
      );
      return;
    }

    try {
      setResetLoading(true);

      await sendPasswordResetEmail(
        auth,
        cleanedEmail
      );

      setResetMessage(
        "Password reset email sent. Check your inbox and spam folder."
      );
    } catch (resetError: unknown) {
      console.error(
        "Password reset error:",
        resetError
      );

      if (
        typeof resetError === "object" &&
        resetError !== null &&
        "code" in resetError
      ) {
        const firebaseError =
          resetError as {
            code: string;
          };

        if (
          firebaseError.code ===
          "auth/invalid-email"
        ) {
          setError(
            "Please enter a valid email address."
          );
        } else if (
          firebaseError.code ===
          "auth/too-many-requests"
        ) {
          setError(
            "Too many reset requests. Please wait a moment and try again."
          );
        } else if (
          firebaseError.code ===
          "auth/network-request-failed"
        ) {
          setError(
            "Please check your internet connection and try again."
          );
        } else {
          setError(
            "We couldn't send the password reset email. Please try again."
          );
        }
      } else {
        setError(
          "We couldn't send the password reset email. Please try again."
        );
      }
    } finally {
      setResetLoading(false);
    }
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

      <section className="auth-card">
        <div className="auth-heading">
          <p className="eyebrow auth-eyebrow">
            WELCOME BACK
          </p>

          <h1>
            Sign in to
            <br />
            Mood<span>Tune</span>
          </h1>

          <p className="auth-description">
            Continue your emotion-aware
            music journey.
          </p>
        </div>

        <form
          className="auth-form"
          onSubmit={handleLogin}
        >
          <div className="form-group">
            <label htmlFor="email">
              Email address
            </label>

            <div className="auth-input-wrap">
              <span
                className="auth-input-icon"
                aria-hidden="true"
              >
                ✉
              </span>

              <input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                autoComplete="email"
                value={email}
                onChange={(event) => {
                  setEmail(
                    event.target.value
                  );

                  if (error) {
                    setError("");
                  }

                  if (resetMessage) {
                    setResetMessage("");
                  }
                }}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">
              Password
            </label>

            <div className="auth-input-wrap">
              <span
                className="auth-input-icon"
                aria-hidden="true"
              >
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
                placeholder="Enter your password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => {
                  setPassword(
                    event.target.value
                  );

                  if (error) {
                    setError("");
                  }
                }}
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

          <div className="auth-options">
            <label className="remember-option">
              <input type="checkbox" />

              <span>Remember me</span>
            </label>

            <button
              type="button"
              className="forgot-link"
              onClick={() => {
                void handlePasswordReset();
              }}
              disabled={
                resetLoading || loading
              }
            >
              {resetLoading
                ? "Sending..."
                : "Forgot password?"}
            </button>
          </div>

          {error ? (
            <p
              role="alert"
              style={{
                margin: 0,
                color: "#ff72c8",
                fontSize: "0.8rem",
                lineHeight: 1.4,
              }}
            >
              {error}
            </p>
          ) : null}

          {resetMessage ? (
            <p
              role="status"
              style={{
                margin: 0,
                padding: "10px 12px",
                border:
                  "1px solid rgba(160, 255, 196, 0.32)",
                borderRadius: "12px",
                color: "#a0ffc4",
                background:
                  "rgba(77, 205, 130, 0.08)",
                fontSize: "0.8rem",
                lineHeight: 1.5,
              }}
            >
              {resetMessage}
            </p>
          ) : null}

          <button
            className="auth-button"
            type="submit"
            disabled={
              loading || resetLoading
            }
          >
            <span>
              {loading
                ? "Signing in..."
                : "Sign in"}
            </span>

            {!loading ? <span>→</span> : null}
          </button>
        </form>

        <div className="auth-divider">
          <span />
          <p>OR</p>
          <span />
        </div>

        <p className="auth-switch">
          New to MoodTune?{" "}
          <Link href="/register">
            Create an account
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