import type {
  FixtureItem,
  OwnerSnapshot,
  OwnerRelevance,
  ReadCondition,
  SnapshotActionMode,
  SourceFreshness,
} from "./types";

export const HOME_EXCEPTION_LIMIT = 3;
export const HOME_OWNER_LIMIT = 1;
const readConditionValues: ReadCondition[] = [
  "healthy",
  "attention",
  "blocked",
  "waiting",
  "unknown",
];
const sourceFreshnessValues: SourceFreshness[] = ["fresh", "stale", "unknown"];
const actionModeValues: SnapshotActionMode[] = [
  "link-only",
  "read-only",
  "safe-bounded",
  "owner-gated",
];

export function ownerItemCountLabel(count: number): string {
  if (count === 0) return "Clear";
  return `${count} owner item${count === 1 ? "" : "s"}`;
}

export function needsOwner(item: FixtureItem): boolean {
  return (
    item.escalation === "OWNER_DECISION_REQUIRED" ||
    item.escalation === "OWNER_ACTION_REQUIRED"
  );
}

export function homeOwnerItems(items: FixtureItem[]): FixtureItem[] {
  return items
    .filter((item) => needsOwner(item) && item.relevance === "INTERRUPT")
    .sort(
      (left, right) =>
        Number(right.id === "fx-19") - Number(left.id === "fx-19"),
    );
}

export function visibleHomeOwnerItems(
  items: FixtureItem[],
  showAll: boolean,
): FixtureItem[] {
  const ownerItems = homeOwnerItems(items);
  return ownerItems.slice(0, showAll ? ownerItems.length : HOME_OWNER_LIMIT);
}

export function visibleFx19Exceptions(
  item: FixtureItem,
  showAll: boolean,
): string[] {
  const exceptions = item.relatedExceptions ?? [];
  return exceptions.slice(
    0,
    showAll ? exceptions.length : HOME_EXCEPTION_LIMIT,
  );
}

export function hasMoreFx19Exceptions(item: FixtureItem): boolean {
  return (item.relatedExceptions?.length ?? 0) > HOME_EXCEPTION_LIMIT;
}

export function businessPulseState(
  items: FixtureItem[],
  area: FixtureItem["area"],
): string {
  if (area === "GM" && homeOwnerItems(items).length > 0) {
    return "Owner queue has active items";
  }
  if (items.some((item) => item.area === area && needsOwner(item)))
    return "Owner item shown above";
  const matching = items.filter(
    (item) => item.area === area && item.relevance !== "SUPPRESS",
  );
  if (matching.length === 0) return "No current update";
  const uncertain = matching.find((item) => item.trust !== "Fresh");
  if (uncertain) return `${uncertain.trust} · ${uncertain.summary}`;
  return matching[0]?.summary ?? "No current update";
}

export function relevantItems(
  items: FixtureItem[],
  relevance: OwnerRelevance,
): FixtureItem[] {
  return items.filter((item) => item.relevance === relevance);
}

export function browseItems(items: FixtureItem[]): FixtureItem[] {
  return items.filter(
    (item) => item.relevance !== "SUPPRESS" && !needsOwner(item),
  );
}

export function validateSnapshot(snapshot: OwnerSnapshot): string[] {
  const errors: string[] = [];
  if (snapshot.contract !== "ldw.owner-snapshot.v1")
    errors.push("Unsupported contract identifier.");
  if (!snapshot.evaluatedAt || Number.isNaN(Date.parse(snapshot.evaluatedAt)))
    errors.push("Evaluation time must be explicit and parseable.");
  const ids = new Set<string>();
  for (const card of snapshot.cards) {
    if (ids.has(card.id)) errors.push(`Duplicate card id: ${card.id}`);
    ids.add(card.id);
    if (
      !card.source ||
      !card.observedAt ||
      !sourceFreshnessValues.includes(card.freshness)
    )
      errors.push(`Card ${card.id} is missing provenance or freshness.`);
    if (!readConditionValues.includes(card.state))
      errors.push(`Card ${card.id} has unsupported state.`);
    if (card.observedAt && Number.isNaN(Date.parse(card.observedAt)))
      errors.push(`Card ${card.id} observation time must be parseable.`);
    if (card.state === "healthy" && card.freshness !== "fresh")
      errors.push(
        `Card ${card.id} cannot be healthy when evidence is ${card.freshness}.`,
      );
    if (!actionModeValues.includes(card.actionMode))
      errors.push(`Card ${card.id} has unsupported action mode.`);
  }
  return errors;
}
