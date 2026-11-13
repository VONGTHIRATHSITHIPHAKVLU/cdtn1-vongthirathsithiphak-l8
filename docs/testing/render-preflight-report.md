# Render Free local preflight — 13 November 2026

No Render service, public URL, commit, push or tag change was made.

| Check | Final result | Exit code |
|---|---|---|
| `npm test` | 46/46 PASS (44 existing + 2 Render adapter tests) | 0 |
| `npm run build` | PASS outside Codex sandbox, 32 modules | 0 |
| `npm audit` | 0 vulnerabilities; registry accessed outside sandbox | 0 |
| `git diff --check` | PASS | 0 |
| New-file whitespace checks | PASS | 0 |
| `docker build -f Dockerfile.render -t smartcrm-render-preflight .` | PASS | 0 |
| Local Docker + Chrome verifier | PASS, 13 checks | 0 |

Runtime evidence: [final results](evidence/render-preflight-2026-11-13T06-40-11-330Z/results.json).
The verifier used a password generated in RAM, loopback-only published ports,
container PORT 12345, a separate image and new containers with **no volume mounts**.
No credential/token/body value was written to the report. The test containers
were stopped afterward; existing containers, volumes and SQLite were not reset.

Validated: weak provisioning fails before startup; non-root user; static file
isolation; fresh seed; unauthenticated management read/write denied; real Chrome
login and React/API rendering; deep survey link and response submit; no CSP
violations; logout; repeat startup without duplicate data; clean-container reseed;
application stdout/stderr privacy; Docker health command using the actual PORT.
The unit/HTTP suite also verifies health returns 500 when SQLite is closed and
the demo request cap leaves health probes usable.

Final heuristic source/history secret scan completed with exit 0. Compared with
the release baseline, the only new candidate is the deliberately invalid short
password fixture at `tests/render.test.js:16`, used to assert startup rejection.
No new real credential was identified; historical `.env` paths remain empty.
Runtime test credentials were generated in RAM and did not enter report files.
The scanner does not prove the absence of every possible secret.

## Failed attempts retained and explained

- The first run of the new unit test suite had 45 PASS / 1 FAIL, exit 1. Its
  cleanup hook closed the intentionally closed test database a second time.
  The cleanup hook now tracks that state; final suite 46/46 PASS. No business
  implementation change was needed for this test-harness failure.
- Docker Engine was initially stopped. Docker Desktop was started locally, with
  no data reset. Final engine version: 29.9.2.
- The [first Docker runtime attempt](evidence/render-preflight-2026-11-13T06-38-52-564Z/results.json)
  passed browser/auth/survey/logout but the verifier timed out after restarting
  the container. Docker assigned a different random host port; the verifier was
  polling its old host port. Application logs showed the server had restarted
  correctly. The verifier now reads the mapping again after restart. The separate
  final attempt passed; the earlier FAIL evidence is unchanged.

## Security decision

Technically ready for a **restricted synthetic-data assessment demo**, subject to
review of these uncommitted files and a fresh random credential configured privately
in Render. This is not production approval. No public deployment has been tested.
Actual Render HTTPS/redirect behavior and platform log behavior must be checked
against the real URL before sharing it.

Remaining limits: single shared manager; no owner/center isolation; account lock
and global rate limits can be abused to interrupt the demo; sessionStorage tokens
remain vulnerable to XSS; SQLite tokens/data are not encrypted by the app; Render
Free storage and RAM sessions are disposable. npm audit does not scan OS/image
packages. The Node base uses a version tag rather than a pinned digest. Application
log checks do not certify Render edge logs. Do not use real customer data or share
the manager password publicly.

Configuration, costs/quotas and operational instructions:
[Render Free guide](../render-free.md).
