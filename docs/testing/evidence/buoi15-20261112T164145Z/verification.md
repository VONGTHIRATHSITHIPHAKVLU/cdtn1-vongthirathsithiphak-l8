# Buoi 15 C1/C5 verification — 12 November 2026

This run verifies local, uncommitted changes based on HEAD a85cd54502d6a026ff01e547c5af03d8de4addaa. It is not a published clean-clone deployment.

| Check | Actual result | Evidence |
|---|---|---|
| `npm.cmd test` | Exit 0; 41 tests, 41 pass, 0 fail/skip | `npm-test.txt` |
| `npm.cmd run build` in sandbox | Exit 1; esbuild could not read parent directories (Access is denied) | `npm-build.txt` |
| Same build with elevated filesystem access | Exit 0; Vite built 32 modules | `npm-build-elevated.txt`, `build-elevated-status.json` |
| `git diff --check` | Exit 0 | `diff-check.txt` |
| `node scripts/demo.js` | Exit 1; generated local ignored configuration; Docker could not read user config and daemon pipe was absent | `docker-launch.txt` |
| `docker compose config --quiet` | Exit 0, with Docker config access warning; configuration validation only, not runtime health | `compose-config.txt` |
| TC-09 migration/seed repeat | Exit 0; both runs `[4,4,1,0,0,0]` on isolated SQLite | `seed-repeat.txt`, `../run-2026-11-12T16-42-21-115Z-17908/` |
| TC-07 individual replay | Exit 0; 1 pass | `single-case.txt`, `../run-2026-11-12T16-42-21-694Z-3948/` |

## Status

- **C1: UNVERIFIED / Docker runtime BLOCKED.** No fresh clone of the changed revision was deployed. Source changes are local and have not been committed/pushed. Existing BT2 evidence is not counted as current C1 verification.
- **C5: implemented.** `docs/deployment-guide.md` has exactly five requested sections and documents the actual launcher, variables, sample data and verification steps. Independent execution of the guide remains pending Docker availability and publication of this revision.
- API and web runtime health checks were not observed in this run. Do not infer PASS from successful Compose configuration parsing.
- No current Docker volume was deleted, no `down -v` was run, and no Git commit/push/tag operation was performed.
- The launcher generated `.env` locally. Credentials are intentionally absent from this report and command output. The file is ignored by Git and Docker build context.

## Two-command candidate workflow

From a parent directory with no `smartcrm-l8-demo` folder:

```powershell
git clone https://github.com/VONGTHIRATHSITHIPHAKVLU/cdtn1-vongthirathsithiphak-l8.git smartcrm-l8-demo
node smartcrm-l8-demo/scripts/demo.js
```

This becomes testable from the public repository only after the project owner authorizes publishing these changes. It includes clone and launcher as two separate commands, without hiding `cd`, npm install, migration or seed commands on the same line. Reading the generated local credential in an editor and opening the browser are manual verification actions.

## Next security work

Complete the seven-item checklist with evidence: history-wide secret scanning, validation coverage, owner/center authorization scope, password hashing/encryption scope, safe errors, log privacy, and dependency vulnerability checks. Demo credential generation does not itself implement owner authorization, password hashing, encryption or HTTPS.
