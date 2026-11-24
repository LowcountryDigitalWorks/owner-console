import {
  adaptOwnerSnapshot,
  type AcceptedOwnerSnapshot,
} from "./ownerSnapshotAdapter";
import type { FixtureItem, ReadCondition, TrustState } from "./types";

const schema = "ldw.owner-snapshot.v1";
const manifest = "ldw.owner-snapshot-manifest.v1";
const authority =
  "https://github.com/LowcountryDigitalWorks/business-operations";
const portfolioRef = "portfolio/CONTROL_TOWER.yaml";
const portfolioLink = authority + "/blob/main/" + portfolioRef;

// Presentation allowlist pinned to the accepted #362 V1 manifest.
// These are contract identities, not a second source of business truth.
const moduleCards: Record<string, readonly string[]> = {
  portfolio: ["portfolio-workstream-counts", "portfolio-material-exceptions"],
  github_work: ["github-open-pr-queue", "github-ci-exceptions"],
  capacity: ["capacity-entitlement-metadata", "capacity-runtime-exceptions"],
  automation: ["automation-flow-exceptions"],
  security: ["security-poam-summary"],
  growth: ["growth-actionable-leads"],
  clients_engagements: ["clients-engagement-references"],
  quick_actions: ["quick-action-deep-links"],
};

const portfolioSpec = {
  system: "portfolio",
  authorityRef: portfolioRef,
  deepLink: portfolioLink,
  actionMode: "read-only",
  maxAgeSeconds: 86400,
};

const selected: Record<
  string,
  {
    system: string;
    authorityRef: string;
    deepLink: string;
    actionMode: string;
    maxAgeSeconds: number;
  }
> = {
  "github-ci-exceptions": {
    system: "github",
    authorityRef: "github:checks/failing",
    deepLink: authority + "/actions",
    actionMode: "link-only",
    maxAgeSeconds: 21600,
  },
  "portfolio-workstream-counts": portfolioSpec,
  "portfolio-material-exceptions": portfolioSpec,
};

const states: ReadCondition[] = [
  "healthy",
  "attention",
  "blocked",
  "waiting",
  "unknown",
];

const freshness = ["fresh", "stale", "unknown"];
const actionModes = ["link-only", "read-only", "safe-bounded", "owner-gated"];
const maximumBytes = 131072;

export interface PrivateOwnerSnapshot {
  generatedAt: string;
  items: FixtureItem[];
  omittedUnknown: number;
}

function invalid(): never {
  // Never include private response contents in exceptions or logs.
  throw new Error("Private owner snapshot unavailable or invalid.");
}

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function keys(value: unknown, allowed: readonly string[]): boolean {
  return (
    record(value) &&
    Object.keys(value).length === allowed.length &&
    allowed.every((key) => Object.hasOwn(value, key))
  );
}

function nonempty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function instant(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(
      value,
    ) &&
    Number.isFinite(Date.parse(value))
  );
}

/**
 * Bounded renderer admission, not the canonical #362 validator.
 * The actual generator and full validator must run in private staging first.
 */
export function parsePrivateOwnerSnapshot(
  value: unknown,
): PrivateOwnerSnapshot {
  if (
    !record(value) ||
    !keys(value, [
      "schema_version",
      "source_manifest_version",
      "generated_at",
      "data_classification",
      "summary",
      "modules",
    ]) ||
    value.schema_version !== schema ||
    value.source_manifest_version !== manifest ||
    value.data_classification !== "internal-sanitized" ||
    !instant(value.generated_at) ||
    !record(value.modules) ||
    !keys(value.modules, Object.keys(moduleCards)) ||
    !record(value.summary) ||
    !keys(value.summary, ["total_cards", ...states, "stale_sources"])
  )
    invalid();

  const counts: Record<ReadCondition, number> = {
    healthy: 0,
    attention: 0,
    blocked: 0,
    waiting: 0,
    unknown: 0,
  };
  const seen = new Set<string>();
  let stale = 0;
  let omittedUnknown = 0;
  for (const [moduleId, ids] of Object.entries(moduleCards)) {
    const module = value.modules[moduleId];
    if (
      !record(module) ||
      !keys(module, ["title", "cards"]) ||
      !nonempty(module.title) ||
      !Array.isArray(module.cards) ||
      module.cards.length !== ids.length
    )
      invalid();

    for (const card of module.cards as unknown[]) {
      if (
        !record(card) ||
        !keys(card, [
          "schema_version",
          "card_id",
          "title",
          "state",
          "summary",
          "source",
          "evidence_refs",
          "deep_link",
          "action_mode",
          "data_classification",
        ]) ||
        card.schema_version !== schema ||
        card.data_classification !== "internal-sanitized" ||
        !nonempty(card.card_id) ||
        !ids.includes(card.card_id) ||
        seen.has(card.card_id) ||
        !nonempty(card.title) ||
        typeof card.summary !== "string" ||
        !states.includes(card.state as ReadCondition) ||
        !record(card.source) ||
        !keys(card.source, [
          "system",
          "authority_ref",
          "observed_at",
          "freshness",
        ]) ||
        !nonempty(card.source.system) ||
        !nonempty(card.source.authority_ref) ||
        typeof card.source.freshness !== "string" ||
        !freshness.includes(card.source.freshness) ||
        (card.source.observed_at !== null &&
          (!instant(card.source.observed_at) ||
            Date.parse(card.source.observed_at) >
              Date.parse(value.generated_at))) ||
        (card.source.freshness !== "unknown" &&
          card.source.observed_at === null) ||
        (card.state === "healthy" && card.source.freshness !== "fresh") ||
        !Array.isArray(card.evidence_refs) ||
        card.evidence_refs.length === 0 ||
        !card.evidence_refs.every(nonempty) ||
        new Set(card.evidence_refs).size !== card.evidence_refs.length ||
        !nonempty(card.deep_link) ||
        typeof card.action_mode !== "string" ||
        !actionModes.includes(card.action_mode)
      )
        invalid();

      seen.add(card.card_id);
      counts[card.state as ReadCondition]++;
      if (card.source.freshness === "stale") stale++;

      const spec = Object.hasOwn(selected, card.card_id)
        ? selected[card.card_id]
        : undefined;
      if (spec) {
        if (
          card.source.system !== spec.system ||
          card.source.authority_ref !== spec.authorityRef ||
          card.deep_link !== spec.deepLink ||
          card.action_mode !== spec.actionMode
        )
          invalid();
      } else {
        // Do not silently introduce new live source coverage through a payload.
        if (
          card.state !== "unknown" ||
          card.source.freshness !== "unknown" ||
          card.source.observed_at !== null
        )
          invalid();
        omittedUnknown++;
      }
    }
  }

  if (
    value.summary.total_cards !== seen.size ||
    value.summary.stale_sources !== stale ||
    states.some((state) => value.summary[state] !== counts[state])
  )
    invalid();

  return {
    generatedAt: value.generated_at,
    items: adaptOwnerSnapshot(
      value as unknown as AcceptedOwnerSnapshot,
      Object.keys(selected),
    ),
    omittedUnknown,
  };
}

export async function loadPrivateOwnerSnapshot(
  signal: AbortSignal,
  fetcher: typeof fetch = fetch,
): Promise<PrivateOwnerSnapshot> {
  const response = await fetcher("/owner-snapshot.json", {
    cache: "no-store",
    credentials: "same-origin",
    redirect: "error",
    signal,
  });
  if (
    !response.ok ||
    response.redirected ||
    response.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase() !==
      "application/json" ||
    !response.headers
      .get("cache-control")
      ?.split(",")
      .some((directive) => directive.trim().toLowerCase() === "no-store")
  )
    invalid();

  const length = response.headers.get("content-length");
  if (length !== null && Number(length) > maximumBytes) invalid();
  const body = await response.text();
  if (new TextEncoder().encode(body).byteLength > maximumBytes) invalid();
  let decoded: unknown;
  try {
    decoded = JSON.parse(body);
  } catch {
    invalid();
  }
  return parsePrivateOwnerSnapshot(decoded);
}

export function privateCardTrust(
  snapshot: PrivateOwnerSnapshot,
  item: FixtureItem,
  now: number,
): TrustState {
  if (!Number.isFinite(now) || now < Date.parse(snapshot.generatedAt))
    return "Unknown";
  if (item.trust !== "Fresh") return item.trust;
  const spec = selected[item.id];
  if (!spec || item.observedAt === null) return "Unknown";
  const observed = Date.parse(item.observedAt);
  if (now < observed) return "Unknown";
  return now >= observed + spec.maxAgeSeconds * 1000 ? "Stale" : "Fresh";
}

export function nextPrivateExpiry(
  snapshot: PrivateOwnerSnapshot,
  now: number,
): number | null {
  const expiries = snapshot.items.flatMap((item) => {
    const spec = selected[item.id];
    if (
      !spec ||
      item.observedAt === null ||
      privateCardTrust(snapshot, item, now) !== "Fresh"
    )
      return [];
    return [Date.parse(item.observedAt) + spec.maxAgeSeconds * 1000];
  });
  return expiries.length ? Math.min(...expiries) : null;
}
