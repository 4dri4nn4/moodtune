"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function GlobalHomeButton() {
  const pathname = usePathname();

  if (pathname === "/") {
    return null;
  }

  return (
    <Link
      href="/"
      className="global-home-button"
      aria-label="Return to MoodTune home"
    >
      <span aria-hidden="true">←</span>
      <span>Back to home</span>
    </Link>
  );
}