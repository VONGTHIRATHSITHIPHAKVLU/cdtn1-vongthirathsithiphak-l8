# Pre-publication verification — 13 November 2026 (Asia/Bangkok)

Requested commit message: `feat: complete Buoi 15-16 deployment and security preparation`.
Scope: preparation for publication, not a v1.0 release or a claim of completed public clean-clone C1.

| Check | Actual result | Evidence |
|---|---|---|
| Current branch/origin | main; expected VONGTHIRATHSITHIPHAKVLU/cdtn1-vongthirathsithiphak-l8 repository | `remote-before.txt` |
| Remote synchronization before publication | Remote main and local HEAD both a85cd54502d6a026ff01e547c5af03d8de4addaa | `remote-before.txt` |
| `npm.cmd test` | Exit 0; 44 passed, 0 failed, 0 skipped | `npm-test.txt`, `status.json` |
| `npm.cmd run build` outside filesystem sandbox | Exit 0; 32 modules built | `npm-build.txt`, `build-status.json` |
| `git diff --check` | Exit 0 | `diff-check.txt` |
| Source/history secret scan | Completed; 48 existing contextual candidates, no new candidates compared with the security review | `secret-scan.json`, `publication-checks.json` |
| Exact-value privacy check | No matches for three local provisioning credentials in proposed publication files; no values recorded | `publication-checks.json` |
| Candidate path review | No unexpected files, .env, actual database, node_modules, dist or .tmp payload | `publication-checks.json` |
| Main documentation links | No missing relative Markdown destinations in README/guide/checklist/API/Buoi16 report | `publication-checks.json` |
| Final Buoi16 screenshots | All four SHA-256 values match the reviewed inventory | `publication-checks.json` |

`commit-files.txt` is the exact proposed path list. Its inclusion is deliberate; snapshot manifests and runtime logs are retained verification artifacts, not copies of temporary source trees. No ignored .tmp tooling/source or .env/database file is included. Earlier failed attempts and redacted synthetic-marker evidence remain clearly labeled and are not converted into PASS.

Security scan limitations and the 48 existing fixture/redaction/capture candidates remain documented in `docs/security-checklist.md` and the earlier security triage. No new confirmed secret or new security blocker was identified. This is not a guarantee of production security: owner/center policy, encryption at rest and HTTPS remain incomplete as disclosed.

README now leads with the current 44-test/local snapshot status, labels historical sections, identifies the current repository, and warns against the legacy BT2 clone guide and moving v0.2. Deployment Guide availability wording is dated so publication does not turn the pre-publication observation into a false current statement.

The first staged whitespace check found an original trailing space in the redacted Nginx raw log (`index-whitespace-initial.txt`). The log was not edited. `.gitattributes` extends the existing raw `.txt` policy to evidence `.log` files (`-text -whitespace`) to preserve original bytes/newlines. The final index check is recorded separately.

Runtime, health, privacy, repeat seed and persistence evidence is in `../buoi16-20261112T165956Z/final/`. Source code matches the application verified there; the current readiness pass changed explanatory documentation only. C1 still needs a real public clone after publication. No new Docker runtime claim is invented in this pass.

The existing v0.2 annotated tag object is d1f76c759ad53fb73d24501d3b4d9c575fc7997f, peeled commit 53e63772e38bf6589a3c0f07de5db1ec734c8d77. Neither is to be changed. No v1.0 tag is part of publication.
