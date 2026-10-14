import { describe, expect, it } from "vitest";
import { ownerSnapshotFixture } from "../data/ownerSnapshotFixture";
import { adaptOwnerSnapshot } from "./ownerSnapshotAdapter";

describe("accepted owner snapshot presentation adapter", () => {
  it("maps only the two authorized Portfolio cards and keeps Product semantics separate", () => {
    const items = adaptOwnerSnapshot(ownerSnapshotFixture);

    expect(items.map((item) => item.id)).toEqual([
      "portfolio-workstream-counts",
      "portfolio-material-exceptions",
    ]);
    expect(items.map((item) => item.relevance)).toEqual(["BRIEF", "BRIEF"]);
    expect(items.map((item) => item.escalation)).toEqual(["none", "none"]);
    expect(items[0]).toMatchObject({
      condition: "healthy",
      trust: "Fresh",
      sourceSystem: "Synthetic Control Tower",
      actionMode: "read-only",
      dataClassification: "internal-sanitized",
    });
  });

  it("preserves unknown evidence without manufacturing an observation time", () => {
    const snapshot = structuredClone(ownerSnapshotFixture);
    const card = snapshot.modules.portfolio!.cards[0]!;
    card.state = "unknown";
    card.source.freshness = "unknown";
    card.source.observed_at = null;

    const item = adaptOwnerSnapshot(snapshot)[0]!;
    expect(item.observedAt).toBeNull();
    expect(item.condition).toBe("unknown");
    expect(item.trust).toBe("Unknown");
  });

  it("rejects stale or unknown evidence claimed as healthy", () => {
    const snapshot = structuredClone(ownerSnapshotFixture);
    const card = snapshot.modules.portfolio!.cards[0]!;
    card.source.freshness = "stale";

    expect(() => adaptOwnerSnapshot(snapshot)).toThrow("healthy uncertainty");
  });

  it("fails closed for malformed or missing selected cards", () => {
    const snapshot = structuredClone(ownerSnapshotFixture);
    snapshot.modules.portfolio!.cards = [];

    expect(() => adaptOwnerSnapshot(snapshot)).toThrow(
      "Missing required snapshot card",
    );
  });
});
