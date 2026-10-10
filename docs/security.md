# Security and data boundary

This repository is public. Release 0.1 is a fixture-only shell and is not connected to production or customer systems. Under owner-console issue #3, Release 0.2 repository support is limited to a static deployment proof using synthetic fixtures. Never commit secrets, credentials, API tokens, OAuth secrets, private owner data, customer records, Coalfire content, PHI/CUI, payment-card data, or confidential production endpoints.

**No secret may ever be stored in a `VITE_*` variable.** Vite variables prefixed this way are exposed to client code. This application does not require environment variables, authentication, or credentials.

Checked-in fixtures must be synthetic and must not encode real owner schedules, customer relationships, amounts, identifiers, or private provider details. The external calendar example is Busy-only. Browser storage is limited to the appearance preference; business-state truth is never persisted there.

Normal rendering performs zero model calls and no external data fetch. No production mutation, service worker, offline business-state cache, background sync, or Web Push is included. The web-app manifest only describes browser presentation and does not establish offline behavior or require service-worker installation.

The public repository does not grant an open-source license. No license file is intentionally present pending a later explicit owner/legal/commercial decision.

The intended `owner-console-02` proof route must be protected by owner-only Cloudflare Access before it is treated as private. Do not add custom application authentication. Wrangler configuration and repository changes do not mutate or authorize Cloudflare/provider state or deployment; provider setup and rollback are separately governed by issue #3. Repository rollback is a Git revert.

Report a suspected security issue privately to the repository owner. Do not file public issues containing credentials, exploit details, private customer information, or sensitive infrastructure data.
