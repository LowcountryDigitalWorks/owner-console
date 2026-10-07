import { describe, expect, it } from "vitest";
import { fixtures } from "../data/fixtures";
import {
  browseItems,
  businessPulseState,
  hasMoreFx19Exceptions,
  homeOwnerItems,
  HOME_OWNER_LIMIT,
  HOME_EXCEPTION_LIMIT,
  needsOwner,
  validateSnapshot,
  visibleHomeOwnerItems,
  visibleFx19Exceptions,
} from "./contracts";
import type { OwnerSnapshot } from "./types";

const snapshot = (overrides: Partial<OwnerSnapshot> = {}): OwnerSnapshot => ({
  contract: "ldw.owner-snapshot.v1",
  evaluatedAt: "2026-10-07T09:00:00-04:00",
  cards: [
    {
      id: "card-1",
      title: "Synthetic card",
      state: "attention",
      source: "fixture",
      observedAt: "2026-10-07T09:00:00-04:00",
      freshness: "Fresh",
      evidenceRefs: ["evidence-1"],
      actionMode: "read-only",
    },
  ],
  ...overrides,
});

describe("Product presentation contract", () => {
  it("includes every required synthetic scenario", () => {
    expect(fixtures).toHaveLength(25);
    expect(new Set(fixtures.map((item) => item.id)).size).toBe(fixtures.length);
    for (const id of [
      "quiet-home",
      "decision-recommendation",
      "owner-auth-action",
      "security-approval",
      "blocked-safe-gm",
      "recovery-exhausted",
      "stale-source",
      "unknown-source",
      "unavailable-source",
      "partial-evidence",
      "meeting-prep",
      "external-busy",
      "promised-followup",
      "deliverable-ready",
      "reports-delivered",
      "report-at-risk",
      "marketing-due",
      "finance-exception",
      "routine-pr-ci",
      "gm-browse",
      "client-ops-a",
      "client-ops-b",
      "generic-quick-action",
      "growth-brief",
      "fx-19",
    ])
      expect(
        fixtures.some((item) => item.id === id),
        id,
      ).toBe(true);
  });

  it("requires explicit accepted escalation for Needs Eddie", () => {
    expect(
      needsOwner(fixtures.find((item) => item.id === "blocked-safe-gm")!),
    ).toBe(false);
    expect(
      needsOwner(fixtures.find((item) => item.id === "generic-quick-action")!),
    ).toBe(false);
    expect(
      needsOwner(fixtures.find((item) => item.id === "routine-pr-ci")!),
    ).toBe(false);
    expect(
      needsOwner(
        fixtures.find((item) => item.id === "decision-recommendation")!,
      ),
    ).toBe(true);
  });

  it("keeps FX-19 to one Home item and reveals its five summaries on demand", () => {
    const ownerMatches = homeOwnerItems(fixtures).filter(
      (item) => item.id === "fx-19",
    );
    expect(ownerMatches).toHaveLength(1);
    const fx = ownerMatches[0]!;
    expect(fx.relatedExceptions).toHaveLength(5);
    expect(HOME_EXCEPTION_LIMIT).toBe(3);
    expect(visibleFx19Exceptions(fx, false)).toHaveLength(3);
    expect(hasMoreFx19Exceptions(fx)).toBe(true);
    expect(visibleFx19Exceptions(fx, true)).toHaveLength(5);
  });

  it("bounds the initial Home owner queue and keeps FX-19 in the first subset", () => {
    expect(HOME_OWNER_LIMIT).toBe(1);
    expect(visibleHomeOwnerItems(fixtures, false)).toHaveLength(
      HOME_OWNER_LIMIT,
    );
    expect(visibleHomeOwnerItems(fixtures, false)[0]?.id).toBe("fx-19");
    expect(visibleHomeOwnerItems(fixtures, true)).toHaveLength(
      homeOwnerItems(fixtures).length,
    );
  });

  it("deduplicates Finance owner actions in Business Pulse", () => {
    expect(businessPulseState(fixtures, "Finance")).toBe(
      "Owner item shown above",
    );
  });

  it("does not project a quiet GM state while owner actions are active", () => {
    expect(businessPulseState(fixtures, "GM")).toBe(
      "Owner queue has active items",
    );
    const quietFixture = fixtures.filter((item) => item.id === "quiet-home");
    expect(homeOwnerItems(quietFixture)).toHaveLength(0);
    expect(businessPulseState(quietFixture, "GM")).toContain(
      "Synthetic calm-state case",
    );
  });

  it("keeps owner escalations in the primary queue and routine recovery suppressed from Browse", () => {
    const browseIds = browseItems(fixtures).map((item) => item.id);
    expect(browseIds).not.toContain("finance-exception");
    expect(browseIds).not.toContain("fx-19");
    expect(browseIds).not.toContain("routine-pr-ci");
    expect(browseIds).toContain("generic-quick-action");
    expect(browseIds).toContain("blocked-safe-gm");
  });

  it("keeps unknown, unavailable, partial, and stale states explicit", () => {
    for (const id of [
      "stale-source",
      "unknown-source",
      "unavailable-source",
      "partial-evidence",
    ]) {
      expect(fixtures.find((item) => item.id === id)?.trust).not.toBe("Fresh");
    }
  });

  it("validates a minimal public consumer snapshot", () => {
    expect(validateSnapshot(snapshot())).toEqual([]);
  });

  it("rejects duplicate identity, missing provenance, unhealthy uncertainty, and owner-gated escalation inference", () => {
    const invalid = snapshot({
      cards: [
        {
          id: "same",
          title: "First",
          state: "healthy",
          source: "",
          observedAt: "",
          freshness: "Unavailable",
          evidenceRefs: [],
          actionMode: "owner-gated",
        },
        {
          id: "same",
          title: "Second",
          state: "healthy",
          source: "fixture",
          observedAt: "2026-10-07T09:00:00-04:00",
          freshness: "Unknown",
          evidenceRefs: [],
          actionMode: "read-only",
        },
      ],
    });
    const errors = validateSnapshot(invalid);
    expect(errors.some((error) => error.includes("Duplicate card id"))).toBe(
      true,
    );
    expect(errors.some((error) => error.includes("missing provenance"))).toBe(
      true,
    );
    expect(errors.some((error) => error.includes("cannot be healthy"))).toBe(
      true,
    );
    expect(errors.some((error) => error.includes("owner-gated metadata"))).toBe(
      true,
    );
  });
});
