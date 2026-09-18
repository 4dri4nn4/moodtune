import { describe, expect, it } from "vitest";

import { getTrackLoadMessage } from "./trackErrors";

describe("getTrackLoadMessage", () => {
  it("explains a Firestore permission failure", () => {
    expect(
      getTrackLoadMessage({
        code: "permission-denied",
      })
    ).toContain("access was denied");
  });

  it("provides a recoverable message for other failures", () => {
    expect(
      getTrackLoadMessage(new Error("offline"))
    ).toContain("Check your connection");
  });
});
