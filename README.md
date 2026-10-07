# Owner Console

A dark-first, responsive shell for a future Lowcountry Digital Works owner workspace. Release 0.1 is a **fixture-only, non-production prototype**: all displayed business state is synthetic, no provider is connected, and no production action can be executed.

## Start locally

Requires Node.js 22 or newer and npm.

```sh
npm ci
npm run dev
```

## Deterministic checks

```sh
npm run typecheck
npm test
npm run format:check
npm run build
```

## Product shape

- Mobile destinations: **Home | Today | More**. Client Ops and detailed GM, Systems, Finance, Growth, and Security views are available from More.
- Home places **NOW**, **TODAY**, and **BUSINESS PULSE** in that order. The owner queue is explicit and bounded; FX-19 is one summary with three visible exception lines and a **View all 5** control. The next commitment stays directly after NOW.
- Today includes the LDW agenda, a sanitized external Busy-only block, people/follow-up, deliverables, reports, communications, and marketing.
- Dark is the default. An explicitly saved light or dark preference wins; OS/browser appearance does not select the first-use theme.
- See [architecture](docs/architecture.md), [product contracts](docs/product-contracts.md), [security](docs/security.md), and [AGENTS.md](AGENTS.md).

## Governance lineage

Release 0.1 is authorized under [business-operations #300](https://github.com/LowcountryDigitalWorks/business-operations/issues/300), uses UX evidence from [#467](https://github.com/LowcountryDigitalWorks/business-operations/issues/467), and consumes sanitized equivalent semantics from accepted read model [#362](https://github.com/LowcountryDigitalWorks/business-operations/issues/362) / [PR #472](https://github.com/LowcountryDigitalWorks/business-operations/pull/472). These references are governance lineage, not live runtime dependencies.

## Cost, data, and license

Incremental cost: **$0**. No deployment, live integration, authentication, backend, database, AI call, or analytics is included. No license is granted by this public repository; no license file is intentionally present.
