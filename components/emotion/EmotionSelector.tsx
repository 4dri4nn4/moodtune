"use client";

type EmotionSelectorProps = {
  selectedEmotion: string;
  onSelect: (emotion: string) => void;
};

const emotions = [
  "Happy",
  "Calm",
  "Sad",
  "Energetic",
  "Anxious",
  "Reflective",
];

export default function EmotionSelector({
  selectedEmotion,
  onSelect,
}: EmotionSelectorProps) {
  return (
    <div className="emotion-grid">
      {emotions.map((emotion) => {
        const isSelected =
          selectedEmotion === emotion.toLowerCase();

        return (
          <button
            key={emotion}
            type="button"
            className={
              isSelected
                ? "emotion-card emotion-card-selected"
                : "emotion-card"
            }
            onClick={() =>
              onSelect(emotion.toLowerCase())
            }
          >
            {emotion}
          </button>
        );
      })}
    </div>
  );
}