# Render Free — SmartCRM L8 demo

Status update, 13 November 2026: the owner reports deployment at
https://smartcrm-l8-demo.onrender.com from `main`, commit
`c533e7a7a2ae2d232af70f9e92a8817c11798439`, Docker runtime, Singapore region,
Auto Deploy Off. Public HTTPS/Login/assets/health and read-only security probes
were checked; private Render settings/Live status and logs are NOT VERIFIED.
Login/Dashboard success is owner-reported; the owner manages additional screenshots
separately. Missing private screenshots are not marked PASS.
See the [actual deployment steps](deployment-guide.md#online-deployment--render-free-bt3-optional-bonus)
and [online verification/evidence report](testing/render-online-report.md).

The earlier local preflight remains historical evidence; it did not establish a
public deployment. Render preparation was published after `v1.0`; existing
`v1.0`/`v0.2` tags are unchanged. The owner authorized publication of these online
documents and automated evidence without waiting for separately managed screenshots.

## Architecture and scope

The existing Compose deployment has separate Nginx/web and API containers and a
persistent SQLite volume. Render does not run that Compose stack directly.
`Dockerfile.render` instead builds React with `/api` as the browser API base and
copies the compiled bundle into one non-root Node container. The Render adapter
serves HTML/JS/CSS and delegates API requests to the existing Node HTTP backend.
There is no Nginx, second public port, CORS setup, or extra database service.
Existing Compose, Dockerfile, API contract and business rules are unchanged.

The adapter listens on `0.0.0.0` and uses Render's `PORT`, not `APP_PORT`.
Startup validates demo mode and the credential, then migrates/seeds the dedicated
`/app/data/render-demo.sqlite`. It ignores `DB_PATH` so it cannot select the old
Compose database. Demo contacts become `example.invalid` addresses with no phone
numbers; only synthetic names/requests are seeded. It never deletes/resets a DB.
Do not mount a production database or upload/import real customer data.

Render Free's filesystem is ephemeral. **SQLite, survey links, responses and
sessions are not guaranteed to survive restart, redeploy or idle spin-down.**
Missing SQLite is recreated and seeded on startup. Repeated startup against an
existing container filesystem uses idempotent migration/seed. An ordinary local
Docker restart can retain that filesystem; recreating a container without a
volume models the loss of storage. Do not attach a disk or reuse existing volumes.

## Render fields (actual settings reported by the owner)

| Field | Setting |
|---|---|
| Service | Web Service |
| Repository | `VONGTHIRATHSITHIPHAKVLU/cdtn1-vongthirathsithiphak-l8` |
| Branch | `main`, deployment commit `c533e7a7a2ae2d232af70f9e92a8817c11798439` (owner-reported) |
| Language/runtime | Docker |
| Region | Singapore (owner-reported) |
| Instance type | Free; verify the dashboard price before creation |
| Root directory | Repository root (leave blank) |
| Dockerfile path | `./Dockerfile.render` |
| Docker build context | Repository root (`.`) |
| Docker command | Leave blank; use the image CMD |
| Build/start/pre-deploy commands | No override; seed is part of startup |
| Health check path | `/api/health` |
| Auto deploy | Off during the assessed demo; deploy deliberately |
| Persistent disk / extra services | None |

The healthcheck runs SQLite `SELECT 1`, returns HTTP 200 only on success and 500
on DB failure. Missing frontend build files fail startup before a port is opened.
Set Render's HTTP health path explicitly; a Docker HEALTHCHECK is not a substitute.

## Environment variables

Variable names: `DEMO_PASSWORD`, `DEMO_ONLY`, `PORT`, `NODE_ENV`, `LOG_LEVEL`.

Generate a **new cryptographically random secret of at least 32 characters** in
Render's environment UI (or a password manager), set `DEMO_PASSWORD` privately,
and set `DEMO_ONLY` to `true`. Never reuse the historical capture/test credentials.
The length check rejects short fixtures but cannot prove randomness or uniqueness.
Use username `demo`; share the new password only with the assessor privately.
Never put credentials in a Git file, Docker build argument, screenshot, URL or
`VITE_*` variable. Never print or copy Render environment values into evidence.

Render supplies `PORT`; leave it managed by the platform. `NODE_ENV` and
`LOG_LEVEL` have image defaults. `APP_PORT`, `APP_HOST`, `DB_PATH`, Compose host
ports and `VITE_API_BASE_URL` do not need dashboard overrides. The browser API base
is compiled as same-origin `/api`, with no public API hostname to configure.

## Public security review and demo restrictions

- Authentication: existing scrypt verifier, random bearer sessions, one-hour expiry,
  logout and account lock after five bad passwords remain active. The wrapper caps
  non-health API traffic at 120 requests/minute and login attempts at 12/minute
  globally. These are single-process demo bounds, not a WAF or robust DDoS defense.
  A stranger can exhaust the quota or trigger the shared account lock and interrupt
  the demo. Do not promise availability or production-grade abuse resistance.
- Authorization: one shared manager identity only; all holders of its credential
  have the same read/write rights. Owner/center isolation is still absent. Keep the
  credential private and use synthetic data exclusively. This is not a multi-user
  or multi-tenant CRM deployment.
- Public endpoints: built frontend, health, login and token-bound survey form/submit
  are intentionally reachable without a manager session. Management routes still
  require a valid bearer token. Survey links are bearer capabilities; don't publish
  live links/tokens in evidence. Invalid tokens cannot enumerate customer details.
- Files: the static adapter exposes only built HTML and allowlisted JS/CSS; source,
  `.env`, SQLite, docs and source maps are not served. Unknown paths return 404;
  only `/` and a correctly shaped survey URL receive SPA HTML.
- Transport/session: use Render's managed HTTPS URL and verify HTTP redirects to
  HTTPS before sharing it. TLS terminates at Render; the container speaks HTTP.
  Auth uses Authorization headers and sessionStorage, not cookies, so there are no
  cookie Secure/HttpOnly/SameSite attributes to configure. An XSS could still steal
  a browser token. CSP restricts scripts/connections to the same origin, blocks
  embedding and base-tag injection; inline styles remain permitted for React.
- Logs: the existing API logger records route templates and safe metadata, not raw
  URL/query/body/header/token. Static and rate-limit responses do not log request
  paths. `no-referrer`, `nosniff`, frame denial and no-index headers apply. Render's
  own edge/platform logs are outside this application's privacy guarantee.
- Data: SQLite survey tokens remain plaintext, data is not encrypted at rest by
  the app, sessions live in RAM, and provisioning remains an environment secret.
  Do not enter real names, emails, phones, sensitive comments or real passwords.
  No email/SMS provider is configured; invitation delivery stays local-link only.

Local readiness is not proof of public deployment. Stop before sharing any URL
if startup, auth, HTTPS, log privacy or protected-endpoint checks fail. Restrict
this demo to a short assessment window and suspend the service when finished.

## Cost and limitations (checked 13 November 2026)

Free web-service compute is offered without a compute charge within the plan's
limits. Render grants 750 running Free instance hours per workspace/month, shared
across services. Idle services spin down after 15 minutes and cold start can take
about a minute. Files are lost on redeploy/restart/spin-down; Free has no persistent
disk and cannot scale beyond one instance. Bandwidth and build minutes have
workspace-specific included quotas. Exceeding them can cause billing when a payment
method is present, or suspension; check usage/spend controls in the dashboard.
Do not select a paid instance, disk or database for this demo.

Official references:
[Free service limits](https://render.com/docs/free),
[port binding and TLS](https://render.com/docs/web-services),
[Docker configuration](https://render.com/docs/docker),
[HTTP health checks](https://render.com/docs/health-checks),
[environment secrets](https://render.com/docs/configure-environment-variables).

## Local verification and later public verification

Run `npm test`, `npm run build`, `npm audit`, `git diff --check` and
`docker build -f Dockerfile.render -t smartcrm-render-preflight .`.
Run the resulting container on a loopback-only host port with an in-memory generated
test credential passed through the process environment, demo mode enabled and a
nondefault container `PORT`. Use no volume mounts. Do not dump `docker inspect`
environment values into evidence. Verify frontend/asset loading, survey deep links,
health, unauthenticated management denial, login, invitation/response workflow,
logout, repeat startup, fresh-container reseed and sanitized logs.

For the reported real deployment, public HTTPS, redirect, assets and health now
have independent online evidence. Authenticated Dashboard remains owner-reported;
online survey workflow and Render logs are NOT VERIFIED. Capture missing evidence
without secrets or live token URLs. Do not claim the assessment bonus is awarded
or that the service is Production Ready.
