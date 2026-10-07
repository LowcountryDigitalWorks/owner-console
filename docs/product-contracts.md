# Product contracts

## Separate meanings

| Layer                 | Values                                                     | Meaning                                             |
| --------------------- | ---------------------------------------------------------- | --------------------------------------------------- |
| #362 read condition   | `healthy`, `attention`, `blocked`, `waiting`, `unknown`    | Source-derived card/read state                      |
| #362 source freshness | `fresh`, `stale`, `unknown`                                | Accepted source freshness metadata                  |
| AUTO-STATUS lifecycle | `RUNNING`, `WAITING`, `BLOCKED`, `COMPLETE`                | Execution lifecycle when applicable                 |
| AUTO-ESC escalation   | `none`, `OWNER_DECISION_REQUIRED`, `OWNER_ACTION_REQUIRED` | Explicit accepted request for an owner              |
| Product relevance     | `INTERRUPT`, `BRIEF`, `BROWSE`, `SUPPRESS`                 | Presentation priority                               |
| Product trust         | `Fresh`, `Stale`, `Unknown`, `Unavailable`, `Partial`      | Evidence confidence and recency in the presentation |

A state in one row does not automatically create a value in another. In particular, blocked, attention, waiting, stale, and `action_mode=owner-gated` do not create Needs Eddie. Needs Eddie requires explicit owner escalation evidence and Product relevance `INTERRUPT`.

## Public read-model consumer boundary

`OwnerSnapshot` and `OwnerSnapshotCard` are small public TypeScript consumer interfaces. They are not copied private schema and do not replace the canonical #362 contract. The consumer preserves raw source freshness separately from Product trust and accepts `link-only`, `read-only`, `safe-bounded`, and `owner-gated` action metadata. Action mode is descriptive metadata; no action mode creates Product escalation. Validation rejects duplicate IDs, missing provenance, unsupported values, and healthy state paired with stale or unknown source freshness.

## Trust behavior

Fresh, Stale, Unknown, Unavailable, and Partial are rendered as text with a visual marker. Healthy/quiet is allowed only when source freshness is fresh. Unknown, unavailable, stale, and partial states remain visible and include source context. No balance, count, or status is fabricated when source data is missing. Provenance is reachable on Home cards and detail views.

## Scenario profiles

The prototype-only selector composes the checked-in synthetic records into seven coherent active profiles: Calm, Owner authentication action, Informed owner decision, Trust failure, Client Ops provider A, Client Ops provider B, and FX-19. Home, Today, Browse, and packet lookup use only the selected profile. FX-19 is one bounded owner packet with five exception summaries and no unrelated owner exception.

## Owner packet and fixture set

Where a fixture is an owner decision/action, detail presents category, reason Eddie is needed, one question/action, current and proposed state, recommendation and rationale, tradeoffs, risk, reversibility, alternatives, steps, synthetic reference, copyable non-secret value, expected result, validation, cost/ceiling, rollback, safe-while-waiting, source, evidence, and freshness. All fixtures are synthetic. External Busy-only blocks contain no event title, attendee, or detail.

The stable fixture IDs are `quiet-home`, `decision-recommendation`, `owner-auth-action`, `security-approval`, `blocked-safe-gm`, `recovery-exhausted`, `stale-source`, `unknown-source`, `unavailable-source`, `partial-evidence`, `meeting-prep`, `external-busy`, `promised-followup`, `deliverable-ready`, `reports-delivered`, `report-at-risk`, `marketing-due`, `finance-exception`, `routine-pr-ci`, `gm-browse`, `client-ops-a`, `client-ops-b`, `generic-quick-action`, `growth-brief`, and `fx-19`.

## Presentation deduplication

Escalated owner packets appear once in Home Needs Eddie and their packet detail. Browse lists omit packets and `SUPPRESS` items. Finance Browse uses the non-actionable “Owner item shown above” note when an owner item is already in the queue. Routine PR/CI recovery remains suppressed.
