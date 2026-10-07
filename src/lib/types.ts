export type OwnerRelevance = "INTERRUPT" | "BRIEF" | "BROWSE" | "SUPPRESS";
export type ReadCondition =
  "healthy" | "attention" | "blocked" | "waiting" | "unknown";
export type ExecutionLifecycle = "RUNNING" | "WAITING" | "BLOCKED" | "COMPLETE";
export type OwnerEscalation =
  "none" | "OWNER_DECISION_REQUIRED" | "OWNER_ACTION_REQUIRED";
export type TrustState =
  "Fresh" | "Stale" | "Unknown" | "Unavailable" | "Partial";
export type DestinationId =
  | "home"
  | "today"
  | "clients"
  | "more"
  | "gm"
  | "systems"
  | "finance"
  | "growth"
  | "security";

export interface Evidence {
  label: string;
  detail: string;
  source: string;
  observedAt: string;
  trust: TrustState;
}

export interface Packet {
  category: string;
  whyOwnerRequired: string;
  questionOrAction: string;
  currentState: string;
  proposedState: string;
  recommendation: string;
  rationale: string;
  tradeoffs: string[];
  risk: string;
  reversibility: string;
  alternatives: string[];
  steps: string[];
  authoritativeLink: string;
  copyValue?: string;
  expectedResult: string;
  validation: string;
  costCeiling: string;
  rollback: string;
  safeWhileWaiting: string;
}

export interface FixtureItem {
  id: string;
  title: string;
  summary: string;
  area:
    | "Agenda"
    | "People"
    | "Deliverables"
    | "Reports"
    | "Communications"
    | "Marketing"
    | "Clients"
    | "Finance"
    | "Web / Services"
    | "Security"
    | "Growth"
    | "GM"
    | "Systems";
  relevance: OwnerRelevance;
  condition: ReadCondition;
  lifecycle?: ExecutionLifecycle;
  escalation: OwnerEscalation;
  trust: TrustState;
  source: string;
  observedAt: string;
  nextStep?: string;
  commitment?: string;
  provider?: string;
  packet?: Packet;
  relatedExceptions?: string[];
  evidence?: Evidence[];
}

export interface OwnerSnapshotCard {
  id: string;
  title: string;
  state: ReadCondition;
  source: string;
  observedAt: string;
  freshness: TrustState;
  evidenceRefs: string[];
  actionMode: "read-only" | "owner-gated";
}

export interface OwnerSnapshot {
  contract: "ldw.owner-snapshot.v1";
  evaluatedAt: string;
  cards: OwnerSnapshotCard[];
}
