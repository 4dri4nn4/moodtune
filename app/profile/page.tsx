"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  onAuthStateChanged,
  signOut,
  User,
} from "firebase/auth";

import { auth } from "@/lib/firebase";
import MoodTuneLogo from "@/components/ui/MoodTuneLogo";

export default function ProfilePage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.replace("/login");
        return;
      }

      setUser(currentUser);
      setLoading(false);
    });

    return unsubscribe;
  }, [router]);

  async function handleSignOut() {
    try {
      setSigningOut(true);

      await signOut(auth);

      router.replace("/login");
    } catch (error) {
      console.error("Sign out error:", error);
      setSigningOut(false);
    }
  }

  if (loading) {
    return (
      <main className="auth-page">
        <p>Loading your MoodTune profile...</p>
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

        <p>Every emotion has a soundtrack.</p>
      </div>

      <section className="auth-card">
        <div className="auth-heading">
          <p className="eyebrow auth-eyebrow">
            YOUR MOODTUNE
          </p>

          <h1>
            Welcome,
            <br />
            <span>{user?.displayName || "Listener"}</span>
          </h1>

          <p className="auth-description">
            Your personal space for your MoodTune journey.
          </p>
        </div>

        <div className="profile-details">
          <div className="profile-detail">
            <span className="profile-label">Username</span>
            <strong>{user?.displayName || "Not set"}</strong>
          </div>

          <div className="profile-detail">
            <span className="profile-label">Email address</span>
            <strong>{user?.email || "Not available"}</strong>
          </div>
        </div>

        <div className="profile-actions">
          <Link
            href="/"
            className="auth-button profile-home-button"
          >
            <span>Back to MoodTune</span>
            <span>→</span>
          </Link>

          <button
            type="button"
            className="profile-signout-button"
            onClick={handleSignOut}
            disabled={signingOut}
          >
            {signingOut ? "Signing out..." : "Sign out"}
          </button>
        </div>
      </section>
    </main>
  );
}