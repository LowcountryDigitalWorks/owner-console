# Agent instructions

## Authority and scope

- The public GitHub repository is the implementation source of truth. Check live `main`, open issues, open pull requests, workflows, and local `git status` before substantive work.
- Release 0.1 is limited to the public Owner Console shell and typed fixture consumer. Governance lineage is business-operations #300 and #467; accepted renderer-neutral read model is #362 / PR #472.
- Do not expand this repository into a service, backend, auth system, provider collector, database, action engine, deployment, or production console.

## Data and product invariants

- Fixtures must be obviously synthetic. Never add owner-private, customer, Coalfire, PHI/CUI, payment, credential, token, or confidential endpoint data.
- Never put a secret in a `VITE_*` variable. Local storage may contain only the non-sensitive appearance preference.
- Keep #362 read condition, AUTO-STATUS lifecycle, AUTO-ESC escalation, and Product relevance as separate typed values.
- `Needs Eddie` requires explicit owner escalation evidence. `blocked`, `attention`, `waiting`, `stale`, and `action_mode=owner-gated` do not imply it.
- Keep uncertainty visible. Missing or partial evidence must never become healthy or zero.
- No production mutation control or model call belongs in normal rendering.

## Change control

- Use a branch and pull request; do not develop directly on `main` or merge a release candidate.
- Keep dependencies small, pinned, and explained in the PR. Use npm and commit only `package-lock.json` as lockfile.
- Run `npm run typecheck`, `npm test`, `npm run format:check`, and `npm run build` for implementation changes.
- Do not add licensing without a later explicit owner/legal/commercial decision.
