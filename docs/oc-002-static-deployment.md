# OC-002 static deployment proof

Release 0.2 repository support is limited to a static proof using synthetic fixtures under [owner-console issue #3](https://github.com/LowcountryDigitalWorks/owner-console/issues/3). Wrangler names the future Worker `owner-console-02`, builds the site to `dist/`, enables only its `workers.dev` proof route, and serves SPA navigation from the static assets. There is no Worker main script, binding, backend, live data, custom hostname, or custom route.

Cloudflare Access is the provider-side authentication boundary. Owner-only Access must protect the proof route before it is treated as private; the application adds no custom authentication. The repository configuration neither deploys nor authorizes Cloudflare/provider mutation. Provider setup and rollback remain separately governed by issue #3. Repository rollback is a Git revert.

The static `_headers` policy uses a same-origin CSP without `unsafe-inline` or `unsafe-eval`, denies framing, disables unused browser capabilities, prevents indexing, and sets `Cache-Control: no-cache`. Vite currently emits content-hashed `/assets/*` files and rewrites the manifest link to its hashed output; assets remain revalidated rather than assigned a long-lived cache. No service worker or offline business-state cache is included.
