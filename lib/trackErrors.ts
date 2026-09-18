export function getTrackLoadMessage(
  error: unknown
) {
  const errorCode =
    typeof error === "object" &&
    error !== null &&
    "code" in error
      ? String(error.code)
      : "";

  return errorCode === "permission-denied"
    ? "The music catalogue is temporarily unavailable because access was denied. Please try again shortly."
    : "We couldn't load your MoodTune recommendations. Check your connection and try again.";
}
