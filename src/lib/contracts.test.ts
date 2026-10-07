import { describe, expect, it } from "vitest";
import { fixtures } from "../data/fixtures";
import { fixturesForScenario, scenarioProfiles } from "../data/scenarios";
import {
  browseItems,
  businessPulseState,
  hasMoreFx19Exceptions,
  homeOwnerItems,
  HOME_EXCEPTION_LIMIT,
  HOME_OWNER_LIMIT,
  needsOwner,
  ownerItemCountLabel,
  validateSnapshot,
  visibleHomeOwnerItems,
  visibleFx19Exceptions,
} from "./contracts";
import type {
  OwnerSnapshot,
  SnapshotActionMode,
  SourceFreshness,
} from "./types";

const card = (
  overrides: Partial<OwnerSnapshot["cards"][number]> = {},
): OwnerSnapshot["cards"][number] => ({
  id: "card-1",
  title: "Synthetic card",
  state: "attention",
  source: "fixture",
  observedAt: "2026-10-07T09:00:00-04:00",
  freshness: "fresh",
  evidenceRefs: ["evidence-1"],
  actionMode: "read-only",
  ...overrides,
});

const snapshot = (
  freshness: SourceFreshness = "fresh",
  actionMode: SnapshotActionMode = "read-only",
  state: "healthy" | "attention" = "attention",
): OwnerSnapshot => ({
  contract: "ldw.owner-snapshot.v1",
  evaluatedAt: "2026-10-07T09:00:00-04:00",
  cards: [card({ freshness, actionMode, state })],
});

const withCards = (cards: OwnerSnapshot["cards"]): OwnerSnapshot => ({
  ...snapshot(),
  cards,
});

describe("Product presentation contract", () => {
  it("retains all 25 required stable synthetic fixture records", () => {
    const expectedIds = [
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
    ];
    expect(fixtures).toHaveLength(25);
    expect(new Set(fixtures.map((item) => item.id))).toEqual(
      new Set(expectedIds),
    );
  });

  it("requires explicit accepted escalation for Needs Eddie", () => {
    for (const id of [
      "blocked-safe-gm",
      "generic-quick-action",
      "routine-pr-ci",
    ]) {
      expect(needsOwner(fixtures.find((item) => item.id === id)!)).toBe(false);
    }
    for (const id of [
      "decision-recommendation",
      "owner-auth-action",
      "security-approval",
      "finance-exception",
      "recovery-exhausted",
      "fx-19",
    ]) {
      expect(needsOwner(fixtures.find((item) => item.id === id)!)).toBe(true);
    }
  });

  it.each(["link-only", "read-only", "safe-bounded", "owner-gated"] as const)(
    "accepts %s metadata without deriving Needs Eddie",
    (mode) => {
      expect(validateSnapshot(snapshot("fresh", mode))).toEqual([]);
      expect(homeOwnerItems(fixturesForScenario("calm"))).toHaveLength(0);
    },
  );

  it("rejects unsupported action modes and healthy states with stale or unknown source freshness", () => {
    const invalidMode = snapshot();
    Object.assign(invalidMode.cards[0]!, { actionMode: "execute-anything" });
    expect(
      validateSnapshot(invalidMode).some((error) =>
        error.includes("unsupported action mode"),
      ),
    ).toBe(true);
    for (const freshness of ["stale", "unknown"] as const) {
      expect(
        validateSnapshot(snapshot(freshness, "read-only", "healthy")).some(
          (error) => error.includes("cannot be healthy"),
        ),
      ).toBe(true);
    }
  });

  it("accepts stale and unknown source freshness when the card is not claimed healthy", () => {
    for (const freshness of ["stale", "unknown"] as const) {
      expect(
        validateSnapshot(snapshot(freshness, "read-only", "attention")),
      ).toEqual([]);
    }
  });

  it("keeps raw source freshness and Product trust as distinct vocabularies", () => {
    expect(["fresh", "stale", "unknown"]).toEqual([
      "fresh",
      "stale",
      "unknown",
    ] satisfies SourceFreshness[]);
    expect([
      "Fresh",
      "Stale",
      "Unknown",
      "Unavailable",
      "Partial",
    ]).toHaveLength(5);
    expect(fixtures.find((item) => item.id === "stale-source")?.trust).toBe(
      "Stale",
    );
  });

  it("exposes seven coherent selectable profiles using only their active fixture sets", () => {
    expect(scenarioProfiles).toHaveLength(7);
    for (const profile of scenarioProfiles) {
      const ids = fixturesForScenario(profile.id).map((item) => item.id);
      expect(ids.length).toBeGreaterThan(0);
      expect(new Set(ids).size).toBe(ids.length);
      expect(ids).not.toContain("security-approval");
      expect(ids).not.toContain("finance-exception");
    }
    const calm = fixturesForScenario("calm");
    expect(homeOwnerItems(calm)).toHaveLength(0);
    expect(calm.some((item) => item.relevance === "BRIEF")).toBe(true);
    expect(calm.some((item) => item.relevance === "BROWSE")).toBe(true);
    expect(calm.some((item) => item.relevance === "SUPPRESS")).toBe(true);
    expect(
      homeOwnerItems(fixturesForScenario("owner-action")).map(
        (item) => item.id,
      ),
    ).toEqual(["owner-auth-action"]);
    expect(
      homeOwnerItems(fixturesForScenario("decision")).map((item) => item.id),
    ).toEqual(["decision-recommendation"]);
    expect(
      fixturesForScenario("trust-failure").filter(
        (item) => item.trust !== "Fresh",
      ),
    ).toHaveLength(4);
    expect(
      fixturesForScenario("client-a").find((item) => item.area === "Clients")
        ?.provider,
    ).toBe("Provider A");
    expect(
      fixturesForScenario("client-b").find((item) => item.area === "Clients")
        ?.provider,
    ).toBe("Provider B");
    expect(
      homeOwnerItems(fixturesForScenario("fx-19")).map((item) => item.id),
    ).toEqual(["fx-19"]);
  });

  it("keeps Browse calculations profile-scoped and excludes owner and suppressed items", () => {
    const calmBrowseIds = browseItems(fixturesForScenario("calm")).map(
      (item) => item.id,
    );
    expect(calmBrowseIds).toContain("generic-quick-action");
    expect(calmBrowseIds).toContain("blocked-safe-gm");
    expect(calmBrowseIds).not.toContain("routine-pr-ci");
    expect(calmBrowseIds).not.toContain("finance-exception");
    expect(
      browseItems(fixturesForScenario("client-a")).map((item) => item.id),
    ).not.toContain("client-ops-b");
  });

  it("keeps FX-19 in the first Home subset and reveals all five summaries on demand", () => {
    const fx = homeOwnerItems(fixtures)[0]!;
    expect(HOME_OWNER_LIMIT).toBe(1);
    expect(visibleHomeOwnerItems(fixtures, false)).toHaveLength(
      HOME_OWNER_LIMIT,
    );
    expect(visibleHomeOwnerItems(fixtures, false)[0]?.id).toBe("fx-19");
    expect(visibleHomeOwnerItems(fixtures, true)).toHaveLength(
      homeOwnerItems(fixtures).length,
    );
    expect(HOME_EXCEPTION_LIMIT).toBe(3);
    expect(visibleFx19Exceptions(fx, false)).toHaveLength(3);
    expect(hasMoreFx19Exceptions(fx)).toBe(true);
    expect(visibleFx19Exceptions(fx, true)).toHaveLength(5);
    expect(
      homeOwnerItems(fixturesForScenario("fx-19")).map((item) => item.id),
    ).toEqual(["fx-19"]);
  });

  it("reports the full active NOW count truthfully", () => {
    expect(ownerItemCountLabel(0)).toBe("Clear");
    expect(ownerItemCountLabel(1)).toBe("1 owner item");
    expect(ownerItemCountLabel(5)).toBe("5 owner items");
    expect(homeOwnerItems(fixturesForScenario("fx-19"))).toHaveLength(1);
  });

  it("deduplicates Finance owner actions in Business Pulse", () => {
    expect(businessPulseState(fixtures, "Finance")).toBe(
      "Owner item shown above",
    );
    expect(businessPulseState(fixturesForScenario("fx-19"), "Finance")).toBe(
      "Owner item shown above",
    );
  });

  it("does not turn a blocked GM fallback into an owner item", () => {
    const blocked = fixtures.filter((item) => item.id === "blocked-safe-gm");
    expect(homeOwnerItems(blocked)).toHaveLength(0);
    expect(businessPulseState(blocked, "GM")).toContain(
      "The workflow is blocked, but no accepted owner escalation exists",
    );
    expect(businessPulseState(fixturesForScenario("owner-action"), "GM")).toBe(
      "Owner queue has active items",
    );
  });

  it("keeps owner escalations and suppressed recovery out of Browse", () => {
    const ids = browseItems(fixtures).map((item) => item.id);
    expect(ids).not.toContain("finance-exception");
    expect(ids).not.toContain("fx-19");
    expect(ids).not.toContain("routine-pr-ci");
    expect(ids).toContain("generic-quick-action");
    expect(ids).toContain("blocked-safe-gm");
  });

  it("keeps Product trust failure states explicit", () => {
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

  it("rejects duplicate identity, missing provenance, and healthy uncertainty", () => {
    const incomplete = card();
    Object.assign(incomplete, { source: "", observedAt: "" });
    const staleHealthy = card({
      id: "stale",
      freshness: "unknown",
      state: "healthy",
    });
    const errors = validateSnapshot(
      withCards([
        incomplete,
        card({ id: "duplicate" }),
        card({ id: "duplicate" }),
        staleHealthy,
      ]),
    );
    expect(errors.some((error) => error.includes("Duplicate card id"))).toBe(
      true,
    );
    expect(errors.some((error) => error.includes("missing provenance"))).toBe(
      true,
    );
    expect(errors.some((error) => error.includes("cannot be healthy"))).toBe(
      true,
    );
  });
});
