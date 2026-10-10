import { describe, expect, it } from "vitest";
import { validateSnapshot } from "./contracts";
import type { OwnerSnapshot } from "./types";

function validSnapshot(): OwnerSnapshot {
  return {
    contract: "ldw.owner-snapshot.v1",
    evaluatedAt: "2026-10-07T09:05:00-04:00",
    cards: [
      {
        id: "card-1",
        title: "Synthetic card",
        state: "attention",
        source: "fixture",
        observedAt: "2026-10-07T13:00:00.123Z",
        freshness: "fresh",
        evidenceRefs: ["evidence-1"],
        actionMode: "read-only",
      },
    ],
  };
}

describe("Owner snapshot runtime hardening", () => {
  it("preserves accepted ISO-instant snapshot behavior", () => {
    expect(validateSnapshot(validSnapshot())).toEqual([]);
  });

  it("rejects unsupported card states at runtime", () => {
    const candidate = validSnapshot();
    Object.assign(candidate.cards[0]!, { state: "paused" });

    expect(
      validateSnapshot(candidate).some((error) =>
        error.includes("unsupported state"),
      ),
    ).toBe(true);
  });

  it("rejects date-only observation timestamps even when Date.parse accepts them", () => {
    const candidate = validSnapshot();
    candidate.cards[0]!.observedAt = "2026-10-07";

    expect(Number.isFinite(Date.parse(candidate.cards[0]!.observedAt))).toBe(
      true,
    );
    expect(
      validateSnapshot(candidate).some((error) =>
        error.includes("observation time must be an ISO-8601 instant"),
      ),
    ).toBe(true);
  });

  it("rejects malformed observation timestamps", () => {
    const candidate = validSnapshot();
    candidate.cards[0]!.observedAt = "not-a-timestamp";

    expect(
      validateSnapshot(candidate).some((error) =>
        error.includes("observation time must be an ISO-8601 instant"),
      ),
    ).toBe(true);
  });

  it("rejects non-string observation timestamps after runtime type erasure", () => {
    const candidate = validSnapshot();
    Object.assign(candidate.cards[0]!, { observedAt: 1728306000000 });

    expect(
      validateSnapshot(candidate).some((error) =>
        error.includes("observation time must be an ISO-8601 instant"),
      ),
    ).toBe(true);
  });

  it("rejects date-only evaluation timestamps", () => {
    const candidate = validSnapshot();
    candidate.evaluatedAt = "2026-10-07";

    expect(Number.isFinite(Date.parse(candidate.evaluatedAt))).toBe(true);
    expect(
      validateSnapshot(candidate).some((error) =>
        error.includes("Evaluation time must be an explicit ISO-8601 instant"),
      ),
    ).toBe(true);
  });
});
