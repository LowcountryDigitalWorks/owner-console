import type { AcceptedOwnerSnapshot } from "../lib/ownerSnapshotAdapter";

export const ownerSnapshotFixture: AcceptedOwnerSnapshot = {
  schema_version: "ldw.owner-snapshot.v1",
  source_manifest_version: "ldw.owner-snapshot-manifest.v1",
  generated_at: "2026-10-07T13:05:00Z",
  data_classification: "internal-sanitized",
  summary: {
    total_cards: 2,
    healthy: 1,
    attention: 1,
    blocked: 0,
    waiting: 0,
    unknown: 0,
    stale_sources: 0,
  },
  modules: {
    portfolio: {
      title: "Portfolio",
      cards: [
        {
          schema_version: "ldw.owner-snapshot.v1",
          card_id: "portfolio-workstream-counts",
          title: "Portfolio workstream counts",
          state: "healthy",
          summary:
            "Synthetic portfolio fixture: 3 running, 1 waiting workstream.",
          source: {
            system: "Synthetic Control Tower",
            authority_ref: "https://example.invalid/synthetic/control-tower",
            observed_at: "2026-10-07T13:00:00Z",
            freshness: "fresh",
          },
          evidence_refs: ["synthetic-control-tower-001"],
          deep_link: "https://example.invalid/synthetic/portfolio",
          action_mode: "read-only",
          data_classification: "internal-sanitized",
        },
        {
          schema_version: "ldw.owner-snapshot.v1",
          card_id: "portfolio-material-exceptions",
          title: "Portfolio material exceptions",
          state: "attention",
          summary:
            "Synthetic portfolio fixture: one workstream is waiting on evidence.",
          source: {
            system: "Synthetic Control Tower",
            authority_ref: "https://example.invalid/synthetic/control-tower",
            observed_at: "2026-10-07T13:00:00Z",
            freshness: "fresh",
          },
          evidence_refs: ["synthetic-control-tower-002"],
          deep_link: "https://example.invalid/synthetic/exceptions",
          action_mode: "link-only",
          data_classification: "internal-sanitized",
        },
      ],
    },
  },
};
