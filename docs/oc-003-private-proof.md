# OC-003 private one-shot proof mode

Status: source candidate only; no provider acceptance or deployment authority.

The default build and public CI remain synthetic. A deliberately selected
`npm run build -- --mode owner-private` renders the bounded read-only proof
instead of synthetic scenarios. The mode flag is not a secret or data source.

Before any private deployment, generate and validate one fresh, approved
`ldw.owner-snapshot.v1` artifact using the accepted business-operations #362
generator, manifest and full validator in a private isolated workspace. The
renderer is not a substitute for canonical validation. Copy only the validated
artifact to the private build's ignored `dist/owner-snapshot.json` after build.
Never put the artifact into source, public/, VITE_* values, public CI artifacts,
logs, or Git history. Do not use a normal synthetic build as a private proof.

The explicit private mode accepts the two Portfolio cards and the existing
GitHub CI exception card, with all other cards remaining UNKNOWN. It checks
manifest membership and counts, allowed provenance and links, and response
JSON/no-store semantics; errors and missing payload do not fall back to
synthetic or previous data. The display applies the accepted manifest age
limits to observations without altering the source snapshot. It does not infer
owner escalation, lifecycle or current healthy status from unavailable evidence.
Browser visibility/page lifecycle and Access logout controls discard the
in-memory projection; restored pages re-read the protected same-origin
payload. These are source controls, not proof of provider or browser security.

No backend, runtime provider collection, database, new dependencies,
permissions or scheduled refresh. The existing source candidate remains held
until #13 dependency remediation, applicable repository checks and independent
exact-head review. Provider acceptance separately requires fresh Access
configuration and anonymous/owner runtime tests, previews OFF, no-store,
logout/history/BFCache validation, exact deployment/rollback, and explicit
local staging and provider payload/version retention/cleanup evidence.

Provider deployment or retention is not proven by this document.
