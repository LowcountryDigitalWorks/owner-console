# Product contracts

## Separate meanings

| Layer                 | Values                                                     | Meaning                                |
| --------------------- | ---------------------------------------------------------- | -------------------------------------- |
| #362 read condition   | `healthy`, `attention`, `blocked`, `waiting`, `unknown`    | Source-derived card/read state         |
| AUTO-STATUS lifecycle | `RUNNING`, `WAITING`, `BLOCKED`, `COMPLETE`                | Execution lifecycle when applicable    |
| AUTO-ESC escalation   | `none`, `OWNER_DECISION_REQUIRED`, `OWNER_ACTION_REQUIRED` | Explicit accepted request for an owner |
| Product relevance     | `INTERRUPT`, `BRIEF`, `BROWSE`, `SUPPRESS`                 | Presentation priority                  |
| Trust/freshness       | `Fresh`, `Stale`, `Unknown`, `Unavailable`, `Partial`      | Evidence confidence and recency        |

A state in one row does not automatically create a value in another. In particular, blocked/attention/waiting/stale and `action_mode=owner-gated` do not create Needs Eddie. Needs Eddie requires an explicit owner escalation or equivalent synthetic escalation evidence and Product relevance `INTERRUPT`.

## Public read-model consumer boundary

`OwnerSnapshot` and `OwnerSnapshotCard` are small public TypeScript consumer interfaces, not a copied private schema and not a replacement canonical contract. They retain identity, title, read state, source, observation time, freshness, evidence references, and read-only/owner-gated action metadata. The consumer validator rejects duplicate IDs, missing provenance, healthy state with uncertain freshness, and attempts to interpret `owner-gated` as Product escalation.

## Trust behavior

Fresh, Stale, Unknown, Unavailable, and Partial are always rendered with text and an accompanying visual marker. Healthy/quiet is allowed only when evidence is fresh. Unknown, unavailable, stale, and partial states remain visible and include source context. No balance, count, or status is fabricated when source data is missing. Provenance is reachable on Home cards and detail views.

## Owner packet

Where a fixture is an owner decision/action, detail presents category, reason Eddie is needed, one question/action, current and proposed state, recommendation and rationale, tradeoffs, risk, reversibility, alternatives, numbered steps, synthetic authoritative link, copyable non-secret fixture value, expected result, recheck, cost/ceiling, recovery, safe-while-waiting, source, evidence, and freshness. The interface is review-only; no production action buttons are provided.

## Fixture inventory

The 25 stable fixture IDs are asserted in tests: `quiet-home`, `decision-recommendation`, `owner-auth-action`, `security-approval`, `blocked-safe-gm`, `recovery-exhausted`, `stale-source`, `unknown-source`, `unavailable-source`, `partial-evidence`, `meeting-prep`, `external-busy`, `promised-followup`, `deliverable-ready`, `reports-delivered`, `report-at-risk`, `marketing-due`, `finance-exception`, `routine-pr-ci`, `gm-browse`, `client-ops-a`, `client-ops-b`, `generic-quick-action`, `growth-brief`, and `fx-19`.

All sample text and references are synthetic. External Busy-only blocks contain no event title, attendee, or detail.

## Presentation deduplication

Escalated owner packets appear only in the Home Needs Eddie queue and its packet detail. Browse lists omit those packets and omit `SUPPRESS` items; Finance Browse uses a non-actionable “Owner item shown above” note when a Finance exception is already in the queue. Routine PR / CI recovery remains suppressed.
