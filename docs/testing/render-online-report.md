# Render online deployment — BT3 optional bonus evidence

Date: 13 November 2026, Asia/Bangkok. Automated public observations were captured
at 08:37–08:38 UTC (15:37–15:38 Asia/Bangkok). This is a real online verification,
separate from the earlier local Docker preflight. No business logic, Render
environment setting, database, deployment or tag was changed by those checks.
The owner subsequently authorized publishing the documents and automated evidence;
additional assessment screenshots will be captured and managed separately. Their
absence does not block documentation publication or change any NOT VERIFIED result.

Public website: https://smartcrm-l8-demo.onrender.com

## Deployment identity and source of information

The owner reports Render Free Web Service, Docker, Singapore, branch `main`,
Auto Deploy Off, `./Dockerfile.render`, repository-root build context and health
path `/api/health`. The reported deployment commit is
[`c533e7a7a2ae2d232af70f9e92a8817c11798439`](https://github.com/VONGTHIRATHSITHIPHAKVLU/cdtn1-vongthirathsithiphak-l8/commit/c533e7a7a2ae2d232af70f9e92a8817c11798439).
Its existence was verified through GitHub API (HTTP 200); the local Git object and
Dockerfile/start script/adapter agree with the deployment instructions.

There is no authenticated Render dashboard access in this verification. Live
status, region/plan/settings, environment values, exact running commit and private
deploy/runtime logs are **NOT VERIFIED independently**. The public responses do
not expose a revision identifier. The online JS bundle hash differs from the
current local build; CSS matches. Both public assets return 200 and execute/render,
but this does not establish byte-for-byte build identity or the cause of the hash
difference. A Render deploy/revision screenshot is still needed; no source change
or deployment correction was inferred from the hash difference alone.

Release `v1.0` stays at `fdc236aff0af0421faf938a0c9ffe919a044e9b5` and predates the
Render preparation. `v0.2` stays at `53e63772e38bf6589a3c0f07de5db1ec734c8d77`.

## Independent public checks

All requests were unauthenticated GETs. No password was requested/read/guessed,
no login was attempted, no survey token was used, and no records were modified.

| Check | Observed result |
|---|---|
| HTTPS root | HTTP 200 with normal certificate validation; actual Login captured |
| HTTP URL | HTTP 301 to the HTTPS root |
| Built JavaScript and CSS | Both HTTP 200 with JS/CSS content types; sizes/hashes recorded |
| `/api/health` | HTTP 200, `{"status":"ok"}`; actual browser screenshot captured |
| `/api/survey-templates` without token | HTTP 401 |
| `/api/survey-invitations` without token | HTTP 401 |
| `/api/support-requests` without token | HTTP 401 |
| `/api/reports/summary` without token | HTTP 401 |
| `/.env`, `/data/render-demo.sqlite`, `/data/smartcrm.sqlite` | HTTP 404 |
| `/src/backend/server.js`, `/scripts/start-render.js`, `/.git/config` | HTTP 404 |
| Response security headers | CSP, no-referrer, nosniff, frame denial and no-store present |
| Login JavaScript exceptions | None observed in Chrome |
| Missing optional icon | `/favicon.ico` returns 404; noncritical console warning |
| Authenticated Dashboard | USER REPORTED success; screenshot missing |
| Online survey workflow | NOT VERIFIED |
| Actual Render application/deployment logs | NOT VERIFIED; no dashboard access |

No serious error or sensitive response was observed in this limited set of public
checks. This is not a penetration test or proof that every endpoint/log is safe.

### Raw observations and browser follow-up

Evidence directory:
[`render-online-2026-11-13T08-37-51-550Z/`](evidence/render-online-2026-11-13T08-37-51-550Z/).

- [verification.json](evidence/render-online-2026-11-13T08-37-51-550Z/verification.json)
  records statuses, safe response headers, asset hashes and screenshot hashes.
  Its initial Login check says FAIL because it required zero console errors and
  counted one resource 404. The Login itself was captured successfully. This raw
  record is retained unchanged, not rewritten to PASS.
- [browser-followup.json](evidence/render-online-2026-11-13T08-37-51-550Z/browser-followup.json)
  is an intermediate investigation. Its Vietnamese button-name boolean is
  inconclusive: that script was piped through PowerShell's `us-ascii` native input
  encoding. It is not evidence that the Login disappeared.
- [browser-review.json](evidence/render-online-2026-11-13T08-37-51-550Z/browser-review.json)
  reads actual button text from the page and Chrome network events, establishing
  that the missing resource is `/favicon.ico`, with zero JS exceptions. The actual
  follow-up Login screenshot was opened and visually checked. No application
  change was made to hide or fix an optional-icon warning.

## Evidence available and separately managed by the owner

| Evidence | State and file / required action |
|---|---|
| Actual public Login | Captured: [public-login.png](evidence/render-online-2026-11-13T08-37-51-550Z/public-login.png) and [follow-up](evidence/render-online-2026-11-13T08-37-51-550Z/public-login-followup.png) |
| Public URL association | Recorded in JSON and this report; screenshots capture the browser viewport, not the address bar. An owner screenshot including the HTTPS address bar would strengthen the evidence. |
| Actual health page | Captured: [public-health.png](evidence/render-online-2026-11-13T08-37-51-550Z/public-health.png); HTTP 200 is established by the separate request record, not the screenshot alone |
| Render Dashboard `Live` and revision | **MISSING**: owner should capture service name, Live, URL and deployed commit; hide account details and all environment values |
| Render nonsensitive configuration | **MISSING**: capture Free/Docker/Singapore/branch/Dockerfile/context/health/Auto Deploy Off, possibly across more than one screen; keep environment values hidden |
| Dashboard after actual online login | **MISSING**: owner reports success; capture the online page using only demo data, with no password/DevTools/sessionStorage visible |
| Safe deployment/runtime logs | **MISSING / NOT VERIFIED**: owner should inspect actual logs privately; only provide an excerpt/screenshot after checking for secrets, token URLs and personal data |
| Online survey workflow | **NOT VERIFIED / MISSING**: only if successfully tested, capture a safe success state without any survey-token URL, invitation link or real personal data |

Do not use the previously supplied environment screenshot as evidence: it exposes
a credential. Do not ask for that value or include it in repository files. The
owner should ensure privately that a new credential replaced the exposed one;
this report does not verify secret rotation or environment values.

For missing screenshots, use the real browser/Render UI. Do not manufacture a
Live badge, dashboard, address bar or success state. A safe Dashboard image may
include the root HTTPS address, but a survey image must exclude the token-bearing
address/link. Do not publish raw HAR/network exports or browser storage dumps.

## Pre-publication repository checks for this documentation update

| Command | Result | Exit code |
|---|---|---|
| `npm test` | 46/46 PASS; no failed/skipped tests | 0 |
| `npm run build` | PASS outside sandbox; 32 modules | 0 |
| `git diff --check` | PASS (line-ending warnings only) | 0 |
| `git status` | Only documentation and new online evidence before staging; no source changes | 0 |

## Limits and bonus readiness

The public URL and health checks now provide independent evidence of an online
service, and the Deployment Guide includes actual Render steps. These support an
application for the BT3 optional deployment bonus. Repository documentation and
automated evidence can be published now, as authorized by the owner. Additional
Render Live/config/revision and authenticated Dashboard screenshots are managed
separately by the owner, not required to be present in Git before publication.
Online survey and private logs remain NOT VERIFIED independently. No +1.0 award
is claimed; the assessor decides against the original rubric and complete submission.

Render Free may sleep after 15 minutes and take about a minute to wake. Its
ephemeral filesystem can lose SQLite data after restart/redeploy/spin-down; RAM
sessions also disappear. Use synthetic data only. One manager identity, missing
owner/center isolation, sessionStorage bearer tokens, plaintext survey tokens and
availability limits remain. This service is not Production Ready.

Sources: [Render Free limits](https://render.com/docs/free),
[deployment steps](../deployment-guide.md#online-deployment--render-free-bt3-optional-bonus),
[Render configuration/security guide](../render-free.md).
