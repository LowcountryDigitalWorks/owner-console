import type { FixtureItem, ReadCondition, SnapshotActionMode } from "./types";

const contract = "ldw.owner-snapshot.v1";
const manifest = "ldw.owner-snapshot-manifest.v1";
const states = new Set<ReadCondition>([
  "healthy",
  "attention",
  "blocked",
  "waiting",
  "unknown",
]);
const freshness = new Set(["fresh", "stale", "unknown"]);
const actionModes = new Set<SnapshotActionMode>([
  "link-only",
  "read-only",
  "safe-bounded",
  "owner-gated",
]);

export interface AcceptedOwnerSnapshotCard {
  schema_version: typeof contract;
  card_id: string;
  title: string;
  state: ReadCondition;
  summary: string;
  source: {
    system: string;
    authority_ref: string;
    observed_at: string | null;
    freshness: "fresh" | "stale" | "unknown";
  };
  evidence_refs: string[];
  deep_link: string;
  action_mode: SnapshotActionMode;
  data_classification: "internal-sanitized";
}

export interface AcceptedOwnerSnapshot {
  schema_version: typeof contract;
  source_manifest_version: typeof manifest;
  generated_at: string;
  data_classification: "internal-sanitized";
  summary: {
    total_cards: number;
    healthy: number;
    attention: number;
    blocked: number;
    waiting: number;
    unknown: number;
    stale_sources: number;
  };
  modules: Record<
    string,
    { title: string; cards: AcceptedOwnerSnapshotCard[] }
  >;
}

function isInstant(value: string): boolean {
  return (
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(
      value,
    ) && Number.isFinite(Date.parse(value))
  );
}

function validateCard(card: AcceptedOwnerSnapshotCard): string[] {
  const errors: string[] = [];
  if (card.schema_version !== contract)
    errors.push("unsupported card contract");
  if (!card.card_id || !card.title || typeof card.summary !== "string")
    errors.push("card identity or summary is invalid");
  if (!states.has(card.state))
    errors.push(`unsupported state for ${card.card_id}`);
  if (!card.source?.system || !card.source.authority_ref)
    errors.push(`missing provenance for ${card.card_id}`);
  if (!freshness.has(card.source?.freshness))
    errors.push(`unsupported freshness for ${card.card_id}`);
  if (card.source?.observed_at !== null && !isInstant(card.source?.observed_at))
    errors.push(`invalid observation time for ${card.card_id}`);
  if (card.source?.freshness !== "unknown" && card.source?.observed_at === null)
    errors.push(`missing observation time for ${card.card_id}`);
  if (card.state === "healthy" && card.source?.freshness !== "fresh")
    errors.push(`healthy uncertainty for ${card.card_id}`);
  if (!Array.isArray(card.evidence_refs) || card.evidence_refs.length === 0)
    errors.push(`missing evidence refs for ${card.card_id}`);
  if (!/^https?:\/\//.test(card.deep_link))
    errors.push(`invalid deep link for ${card.card_id}`);
  if (!actionModes.has(card.action_mode))
    errors.push(`unsupported action mode for ${card.card_id}`);
  if (card.data_classification !== "internal-sanitized")
    errors.push(`unsupported classification for ${card.card_id}`);
  return errors;
}

function trustFor(
  state: ReadCondition,
  sourceFreshness: AcceptedOwnerSnapshotCard["source"]["freshness"],
): FixtureItem["trust"] {
  if (sourceFreshness === "stale") return "Stale";
  if (sourceFreshness === "unknown" || state === "unknown") return "Unknown";
  return "Fresh";
}

/**
 * Presentation-only mapping. It assigns no Product interruption or lifecycle
 * state: those remain separate from the #362 read card and source freshness.
 */
export function adaptOwnerSnapshot(
  snapshot: AcceptedOwnerSnapshot,
  cardIds = ["portfolio-workstream-counts", "portfolio-material-exceptions"],
): FixtureItem[] {
  if (
    snapshot.schema_version !== contract ||
    snapshot.source_manifest_version !== manifest ||
    !isInstant(snapshot.generated_at) ||
    snapshot.data_classification !== "internal-sanitized" ||
    !snapshot.summary
  )
    throw new Error("Unsupported or malformed owner snapshot envelope.");

  const selected = cardIds.map((cardId) => {
    const card = Object.values(snapshot.modules)
      .flatMap((module) => module.cards)
      .find((candidate) => candidate.card_id === cardId);
    if (!card) throw new Error(`Missing required snapshot card: ${cardId}`);
    const errors = validateCard(card);
    if (errors.length) throw new Error(errors.join("; "));
    return card;
  });

  return selected.map((card) => ({
    id: card.card_id,
    title: card.title,
    summary: card.summary,
    area: "GM",
    relevance: "BRIEF",
    condition: card.state,
    escalation: "none",
    trust: trustFor(card.state, card.source.freshness),
    source: `${card.source.system} · Snapshot generated ${snapshot.generated_at}`,
    sourceSystem: card.source.system,
    authorityRef: card.source.authority_ref,
    observedAt: card.source.observed_at,
    snapshotGeneratedAt: snapshot.generated_at,
    evidenceRefs: card.evidence_refs,
    deepLink: card.deep_link,
    actionMode: card.action_mode,
    dataClassification: card.data_classification,
  }));
}
