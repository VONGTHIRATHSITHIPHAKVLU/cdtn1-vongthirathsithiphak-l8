# SmartCRM L8 Deployment Guide

## 1. Requirements

- Git, Node.js 24.15 or newer (24.22.1 used for verification), and Docker Engine/Desktop with Linux containers and Docker Compose v2 supporting `up --wait`.
- Docker must be running and accessible to your user. Internet access is required to obtain base images and npm packages during the image build.
- Host ports 8080 (web) and 3000 (API) must be available by default. Both are bound to 127.0.0.1; this is a local classroom demo, not a public HTTPS deployment.
- Architecture: React static bundle served by Nginx, Node HTTP API, SQLite in a Docker named volume. No PostgreSQL server or host npm install is needed for this Docker workflow.

## 2. Setup steps

From a directory where `smartcrm-l8-demo` does not exist, execute these **two commands**, one per line. The second command works from the parent directory; no separate `cd`, password editing, migration, seed, or dependency installation command is required.

```powershell
git clone https://github.com/VONGTHIRATHSITHIPHAKVLU/cdtn1-vongthirathsithiphak-l8.git smartcrm-l8-demo
node smartcrm-l8-demo/scripts/demo.js
```

Release availability: this workflow is published in commit `b6a66b5e4c26a1a7ed0b48a8666d0bb1d6dd03a4`. **C1 was verified PASS on a real GitHub clone of that commit on 13 November 2026 (Asia/Bangkok), using exactly the two commands above.** Do not use tag v0.2 for this workflow; that historical tag is unchanged. See the [public clean-clone report](testing/github-cleanclone-report.md).

Verification history: before publication, an independent local snapshot passed the runtime checks while public `main` was still `a85cd54`. That observation is preserved in the [Buoi 16 snapshot report](testing/buoi16-deployment-report.md). The later GitHub clone at `b6a66b5` independently passed both health checks, real Chrome login/sample data, survey workflow, repeat seed/migration, restart persistence, 44/44 tests and TC-07 replay. Clone is command 1 and the launcher is command 2; no directory-change command is required. Host `npm ci` and test commands were run only after deployment for verification, not as setup requirements.

The launcher creates an ignored `.env` with a cryptographically random demo password, or fills an empty/missing `DEMO_PASSWORD` in an existing `.env`. It preserves an existing nonempty password and other settings. It never prints the password. Open the local `.env` privately in your editor, then sign in with username `demo` and its `DEMO_PASSWORD`. Reading the generated credential is a UI action, not an additional shell setup command. No secret must be supplied by the operator.

The launcher runs `docker compose up --build -d --wait --wait-timeout 180` from the project root. On each API container start, migration and seed run before the HTTP server. Repeating the launcher reuses the existing password and Compose volume.

For an existing checkout, run `node scripts/demo.js` from its root. The older `.env.example` + manual configuration workflow and npm development commands remain supported. The launcher does not install host dependencies.

Operational commands below are optional diagnostics/lifecycle actions, not additional steps in the two-command setup. Run them from the clone root:

```powershell
docker compose ps
docker compose logs --tail 50 api web
docker compose down
```

`down` retains the database volume. Never use `down -v` with data you need. Keep the directory/project name unchanged to reuse the same volume. If ports are occupied, set `WEB_PORT`/`API_HOST_PORT` in `.env` and rerun the launcher; this is an exception to the default two-command setup. If Docker is inaccessible, the launcher exits nonzero: fix Docker permissions/daemon access and rerun. A build taking longer than the wait timeout needs diagnostics and a retry, not a claimed PASS.

## 3. Environment variables

The launcher needs no `.env.example` copy. Existing shell variables override Compose `.env` values; clear conflicting Docker/Compose/application overrides before a clean verification. Never run `docker compose config` without `--quiet` in shared evidence because expanded configuration includes the password.

| Variable | Default / purpose |
|---|---|
| `DEMO_PASSWORD` | Generated 32 random bytes encoded as hex in ignored `.env`; required by API authentication. Never place it in `VITE_*`, Git, screenshots or logs. |
| `WEB_PORT` | `8080`, host loopback port mapped to Nginx port 80. |
| `API_HOST_PORT` | `3000`, host loopback port mapped to API port 3000. |
| `LOG_LEVEL` | `info`; API accepts debug/info/warn/error. |
| `APP_HOST`, `APP_PORT` | Local npm defaults 127.0.0.1:3000; Compose fixes container bind to 0.0.0.0:3000. |
| `DB_PATH` | Local npm default `data/smartcrm.sqlite`; Compose fixes `/app/data/smartcrm.sqlite`. |
| `VITE_API_BASE_URL` | Public frontend build configuration; Docker fixes `/api` for same-origin proxying. |

The generated file requests mode 0600 on platforms supporting POSIX permissions. On Windows protect it using your user profile/directory ACLs. This launcher is demo provisioning, not a production secrets manager. Recreating an API container loses in-memory sessions, so log in again. Changing a password requires container recreation; editing a file alone does not change a running process.

## 4. Sample data

`database/migrations/001.sql` creates six tables; `scripts/seed.js` inserts four synthetic customers, four requests and one CSAT template. These are project demo records, not the official course dataset or real customer records.

- `YC-DEMO-001` and `YC-DEMO-002`: completed requests suitable for invitations.
- `YC-DEMO-003`: open request, rejected for invitation creation.
- `YC-DEMO-004`: opted-out customer, rejected for invitation creation.

On a fresh database the counts for customer/request/template/invitation/response/log are `[4,4,1,0,0,0]`. Repeated migration/seed does not duplicate these records. It does not reset user edits or previously submitted responses. Invitation creation returns a local link; EMAIL/SMS delivery is not implemented.

SQLite persists in the Compose project volume `sqlite_data` mounted at `/app/data`. The host development database is separate. Do not delete volumes to reset a demo containing work you need to retain.

## 5. Verify it works

After the launcher succeeds, open **http://127.0.0.1:8080** (or your `WEB_PORT`). Nginx serves the built frontend, not Vite dev mode.

1. Open **http://127.0.0.1:8080/api/health**: expect HTTP 200 and `{"status":"ok"}`. This checks a live SQLite `SELECT 1`; it does not by itself validate all tables or sample data.
2. `docker compose ps` should show both API and web **healthy**. The API image probes `/api/health`; the web image fetches its root page. The web probe alone does not prove API/business functionality.
3. Sign in as `demo` using the generated local credential. Open Templates and confirm the seeded CSAT template on a fresh database.
4. Create an invitation for `YC-DEMO-001`, open its local survey link, submit a score, then check Dashboard. A second submission must be rejected. Use `YC-DEMO-002` if the first request was already used.
5. Rerun the launcher: existing records should remain and seed records should not multiply. Do not expect a previously used invitation to become unused.

Developer checks (separate from deployment, run from the repository root with host dependencies installed): `npm.cmd ci`, `npm.cmd test`, `npm.cmd run build`. On other shells use `npm`. To replay one workshop case: `node scripts/test-buoi14.js TC-07`. That runner saves new evidence; it is not required to deploy.

Record actual command exit codes, health responses and UI observations when verifying C1. Existing BT2 Docker logs and Buoi 14 test evidence do not establish a fresh-clone PASS for this revision. See `docs/testing/evidence/` for dated verification records.
