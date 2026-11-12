# Buoi 15 security verification — 12 November 2026

Changes are local and uncommitted, based on HEAD `a85cd54502d6a026ff01e547c5af03d8de4addaa`.

| Command / check | Actual result | Evidence |
|---|---|---|
| `npm.cmd test` | Exit 0; 44 passed, 0 failed, 0 skipped | `npm-test.txt` |
| `npm.cmd audit --json` in sandbox | Exit 1; registry/cache access failed | `npm-audit-sandbox.json` |
| Same audit with network access | Exit 0; 0 known npm vulnerabilities | `npm-audit-online.json` |
| `npm.cmd run build` in sandbox | Exit 1; esbuild parent directory permission failure | `npm-build-sandbox.txt` |
| Same build outside sandbox | Exit 0; 32 modules built | `npm-build-elevated.txt`, `build-status.json` |
| `node scripts/scan-secrets.js` | Completed; locations only, values never printed | `secret-scan.json` |
| Candidate review | 48 findings: synthetic fixtures, redacted evidence placeholders, historical capture-tool credential; no confirmed production secret | `secret-triage.json` |
| `git diff --check` | Exit 0 | `diff-check-final.txt` |

`status.json` records exit codes and the unchanged v0.2 target. Secret scan counts and scan time are in its JSON report; current worktree counts can grow as evidence is added. One path per unique historical object is recorded, not every commit/path alias. Commits and tag messages are scanned too. Binary files are counted but not OCR-scanned.

The scanner uses rules for provider tokens, private keys, JWTs, credential URLs and literal/env credential assignments, plus exact comparison with the current generated local demo password. No match for that current password was found. Pattern-based inspection is not proof of universal absence of secrets. No historical .env path was found apart from the permitted .env.example.

The published fixture credential in the old capture tool is not used by the two-command deployment. Its use outside the test context cannot be determined from Git: rotate any real environment where a published fixture value was reused. No fixture value is reproduced here. No Git history or old evidence was edited.

Security tests add coverage for salted password verification, forged/bare/logged-out session rejection, session-derived audit actor, safe 500 responses, no-referrer API headers and URL/credential log privacy. Existing validation, token expiry/reuse, lockout and error tests remain in the full suite.

Owner/center authorization is still incomplete: the SRS defines one shared demo manager and no ownership policy. The identity remains user 1, now carried by the session; this is not a multi-user access-control implementation. Provisioning env secrets, survey tokens and customer data are not encrypted at rest. See `docs/security-checklist.md` for all seven statuses.

Docker was not rerun in this security verification; the C1 run records Docker config/daemon access failure. Nginx headers were checked in source only. No clean-clone PASS, image vulnerability scan, HTTPS, load test or penetration-test result is claimed.
