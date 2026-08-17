"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import EmotionSelector from "@/components/emotion/EmotionSelector";
import MoodTuneLogo from "@/components/ui/MoodTuneLogo";

export default function BrowsePage() {
  const router = useRouter();

  const [journeyType, setJourneyType] =
    useState<"feel" | "want">("feel");

  const [selectedEmotion, setSelectedEmotion] = useState("");

  return (
    <main className="emotion-page">
      <Link
        href="/"
        className="auth-brand browse-brand-link"
        aria-label="Go to MoodTune home"
      >
        <MoodTuneLogo size={62} />

        <div className="auth-brand-name">
          Mood<span>Tune</span>
        </div>

        <p>Every emotion has a soundtrack.</p>
      </Link>

      <section className="emotion-panel">

        <div className="emotion-heading">
          <p className="eyebrow auth-eyebrow">
            FIND YOUR SOUND
          </p>

          <h1>
            How are you
            <br />
            feeling today?
          </h1>

          <p>
            Choose how you feel now, or choose how you want your
            music to make you feel.
          </p>
        </div>

        <div className="journey-toggle">
          <button
            type="button"
            className={
              journeyType === "feel"
                ? "journey-toggle-button active"
                : "journey-toggle-button"
            }
            onClick={() => {
              setJourneyType("feel");
              setSelectedEmotion("");
            }}
          >
            I feel...
          </button>

          <button
            type="button"
            className={
              journeyType === "want"
                ? "journey-toggle-button active"
                : "journey-toggle-button"
            }
            onClick={() => {
              setJourneyType("want");
              setSelectedEmotion("");
            }}
          >
            I want to feel...
          </button>
        </div>

        <div className="emotion-selection">
          <h2>
            {journeyType === "feel"
              ? "What best describes your mood?"
              : "How would you like to feel?"}
          </h2>

          <EmotionSelector
            selectedEmotion={selectedEmotion}
            onSelect={setSelectedEmotion}
          />
        </div>

        <button
          type="button"
          className="auth-button emotion-continue-button"
          disabled={!selectedEmotion}
          onClick={() => {
            router.push(
              `/results?journey=${journeyType}&emotion=${selectedEmotion}`
            );
          }}
        >
          <span>
            {selectedEmotion
              ? `Continue with ${selectedEmotion}`
              : "Choose an emotion"}
          </span>

          {selectedEmotion && <span>→</span>}
        </button>
      </section>
    </main>
  );
}