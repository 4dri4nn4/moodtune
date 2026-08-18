"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import EmotionSelector from "@/components/emotion/EmotionSelector";
import MoodTuneLogo from "@/components/ui/MoodTuneLogo";

type JourneyType = "feel" | "want";

type BrowseViewProps = {
  initialJourney: JourneyType;
};

export default function BrowseView({
  initialJourney,
}: BrowseViewProps) {
  const router = useRouter();

  const [journeyType, setJourneyType] =
    useState<JourneyType>(initialJourney);

  const [selectedEmotion, setSelectedEmotion] =
    useState("");

  function handleJourneyChange(
    nextJourney: JourneyType
  ) {
    setJourneyType(nextJourney);
    setSelectedEmotion("");

    router.replace(
      `/browse?journey=${nextJourney}`,
      {
        scroll: false,
      }
    );
  }

  function handleContinue() {
    if (!selectedEmotion) {
      return;
    }

    const parameters = new URLSearchParams({
      journey: journeyType,
      emotion: selectedEmotion,
    });

    router.push(
      `/results?${parameters.toString()}`
    );
  }

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

        <p>
          Every emotion has a soundtrack.
        </p>
      </Link>

      <section className="emotion-panel">
        <div className="emotion-heading">
          <p className="eyebrow auth-eyebrow">
            FIND YOUR SOUND
          </p>

          <h1>
            {journeyType === "feel" ? (
              <>
                How are you
                <br />
                feeling today?
              </>
            ) : (
              <>
                How would you
                <br />
                like to feel?
              </>
            )}
          </h1>

          <p>
            {journeyType === "feel"
              ? "Choose the emotion that best reflects how you feel right now."
              : "Choose the emotion you want your music to help you move towards."}
          </p>
        </div>

        <div
          className="journey-toggle"
          aria-label="Choose your MoodTune journey"
        >
          <button
            type="button"
            className={
              journeyType === "feel"
                ? "journey-toggle-button active"
                : "journey-toggle-button"
            }
            onClick={() =>
              handleJourneyChange("feel")
            }
            aria-pressed={
              journeyType === "feel"
            }
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
            onClick={() =>
              handleJourneyChange("want")
            }
            aria-pressed={
              journeyType === "want"
            }
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
          onClick={handleContinue}
        >
          <span>
            {selectedEmotion
              ? `Continue with ${selectedEmotion}`
              : "Choose an emotion"}
          </span>

          {selectedEmotion && (
            <span>→</span>
          )}
        </button>
      </section>
    </main>
  );
}