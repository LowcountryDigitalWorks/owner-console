import { fixtures } from "./fixtures";
import type { FixtureItem } from "../lib/types";

export const scenarioProfiles = [
  { id: "calm", label: "Calm · no owner action" },
  { id: "owner-action", label: "Owner authentication action" },
  { id: "decision", label: "Informed owner decision" },
  { id: "trust-failure", label: "Trust failure" },
  { id: "client-a", label: "Client Ops · provider A" },
  { id: "client-b", label: "Client Ops · provider B" },
  { id: "fx-19", label: "FX-19 · five owner exceptions" },
] as const;
export type ScenarioId = (typeof scenarioProfiles)[number]["id"];

const dailyIds = [
  "meeting-prep",
  "blocked-safe-gm",
  "external-busy",
  "promised-followup",
  "deliverable-ready",
  "reports-delivered",
  "marketing-due",
  "routine-pr-ci",
  "gm-browse",
  "generic-quick-action",
  "growth-brief",
];
const profileIds: Record<ScenarioId, string[]> = {
  calm: [...dailyIds],
  "owner-action": ["owner-auth-action", ...dailyIds],
  decision: ["decision-recommendation", ...dailyIds],
  "trust-failure": [
    "stale-source",
    "unknown-source",
    "unavailable-source",
    "partial-evidence",
    ...dailyIds,
  ],
  "client-a": ["client-ops-a", ...dailyIds],
  "client-b": ["client-ops-b", ...dailyIds],
  "fx-19": ["fx-19", ...dailyIds],
};

export function fixturesForScenario(id: ScenarioId): FixtureItem[] {
  const selected = new Set(profileIds[id]);
  return fixtures.filter((item) => selected.has(item.id));
}
