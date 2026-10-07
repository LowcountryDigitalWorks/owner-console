# Architecture

## Release boundary

Release 0.1 is a static client application. It loads checked-in synthetic fixtures and presents a responsive owner shell. It has no network data adapter, account system, backend, database, production mutation, telemetry, or model runtime. The manifest supports ordinary browser metadata only; there is no service worker or offline business-state cache.

## Presentation path

```text
Synthetic fixture / typed #362-equivalent consumer card
       ↓
Read condition + source + observed time + freshness + evidence
       ↓
Product relevance and explicit owner escalation remain separate
       ↓
One destination registry → Home / Today / More / detail
```

`src/lib/types.ts` defines distinct read condition, AUTO-STATUS lifecycle, AUTO-ESC owner escalation, Product relevance, and trust state types. The public consumer shape is the minimum needed to represent sanitized normalized card semantics: stable ID, title, read state, source, observation time, freshness, evidence references, and non-executing action metadata. It does not copy the private implementation or establish a competing canonical schema.

`src/lib/contracts.ts` contains deterministic presentation helpers and the narrow consumer fixture validator. It uses no hidden clock and does not fetch or persist business state. `src/data/fixtures.ts` contains the stable synthetic record set. `src/data/scenarios.ts` composes seven selectable, isolated prototype profiles; every Home, Today, Browse, and packet projection receives only the active profile. `src/App.tsx` projects the single destination registry into responsive navigation and views; CSS chooses the rail at wider widths and bottom navigation at phone widths.

## Product hierarchy

Home presents NOW first, followed by the next meaningful commitment, TODAY summary, and BUSINESS PULSE. The initial owner queue is limited to one packet with **View all** for the full queue; FX-19 is prioritized in that first subset so its compact `View all 5` summary is immediately available and the next commitment stays close. An owner item is actionable only when `escalation` explicitly contains `OWNER_DECISION_REQUIRED` or `OWNER_ACTION_REQUIRED`, and its Product relevance is `INTERRUPT`. Each owner item appears once in the primary queue; Business Pulse says “Owner item shown above” for Finance when its exception is already surfaced.

FX-19 remains one owner packet on Home. Three numbered exception summaries appear by default; a button reveals all five. The next commitment appears immediately after the NOW block and remains reachable without opening five separate cards.

## Navigation and responsive behavior

Phone navigation is Home, Today, More. Clients did not earn a permanent first-release navigation slot; its provider-neutral summaries are under More. GM, Systems, Finance, Growth, and Security details are also under More. At 800 CSS px, primary navigation becomes a persistent rail; content remains a readable one-pane priority stream. Detail uses an in-page route so browser history and Back remain available.

## Appearance

Theme precedence is saved local preference, then product default dark. OS/browser color preference is intentionally ignored on first visit. Only the `owner-console-theme` preference is persisted locally.
