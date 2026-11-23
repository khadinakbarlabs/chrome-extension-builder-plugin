# Guided planning steps (chat Studio)

The full edition has a local browser Studio. This edition runs the same planning content in chat. Walk the user through it one step at a time, show choices as short tables, and keep a running Markdown brief they can edit. Checkboxes in the brief are declarations, not executed tests.

## 1. Project basics

| Field | Rule |
| --- | --- |
| Name | Required, at most 75 characters, at least one Latin letter or digit |
| Single purpose | Required, at most 132 characters (Chrome's description limit) |
| Product type | `local`, `cloud` or `hybrid` |
| Main surface | `popup` or `side panel` (options page and content script can be added) |
| Backend | `none`, `existing` or `new`. A local product uses `none`; cloud and hybrid need `existing` or `new` |
| Permissions to justify | From `storage`, `activeTab`, `scripting`, `alarms`, `notifications`, `tabs` (others need a written reason) |
| Exact hosts | Exact HTTPS patterns such as `https://example.com/*`; no wildcard hosts |

Raise these planning issues when they apply: missing name or purpose; length limits exceeded; a cloud/hybrid product without an API plan; a local product that requires a server; wildcard hosts; `scripting` without `activeTab` or exact hosts; `tabs` without a reason why tab metadata is essential (activeTab may be enough).

## 2. The six steps and their checks

| Step | Aim | Checks |
| --- | --- | --- |
| Research | Find the useful edge | Interview or observe target users; compare current alternatives with sources; write one measurable user outcome |
| Architecture | Make boundaries explicit | Map extension, page and server trust boundaries; justify each permission and exact host; plan persistence, retries and worker restarts |
| Experience | Make every state feel considered | Choose surfaces around the user task; design loading, empty, error and signed-out states; review keyboard use, contrast and reduced motion |
| Build | Ship a coherent vertical slice | Build the smallest end-to-end user journey; validate messages and isolate page content; keep secrets and privileged logic on the server |
| Validate | Replace assumptions with evidence | Test the exact built artifact in Chrome; exercise offline, denied permissions and worker restarts; record security and accessibility findings |
| Release | Prepare an honest submission | Match disclosures and privacy policy to actual behavior; package only the reviewed artifact; record submission and live listing separately |

When the product changes (permissions, data flow, surfaces), mark the affected checks stale rather than keeping them ticked.

## 3. Starting candidates

| Candidate | Type / surface / backend | Permissions | Trade-off |
| --- | --- | --- | --- |
| Focused local utility | local / popup / none | storage | Compact popup with durable local state; smallest operational footprint |
| Connected side panel | cloud / side panel / existing | storage, activeTab | Persistent task surface with an authenticated API; needs offline and sign-in states |
| Offline-first workspace | hybrid / side panel / new | storage | Local drafts with optional sync; needs conflict handling, deletion and account boundaries |
| Broad access plus remote code | rejected | tabs | Rejected: unnecessary broad page access and remotely hosted executable code, which Manifest V3 does not allow |

Score viable candidates with the frozen rubric from [team.json](team.json) and [candidate-evaluation.md](candidate-evaluation.md): task success 25, security and privacy 20, usability and accessibility 20, architecture reliability 15, test evidence 10, performance and cost 10. At most three rounds. Hard gates reject a candidate regardless of score.

## 4. Choosing the next task

Pick the next skill from the user's current task or next action:

| Words in the task | Next skill |
| --- | --- |
| fix, bug, broken, crash, debug, repair, failure | chrome-extension-builder-debugging |
| package, zip, publish, release, store listing | chrome-extension-builder-prepare-release |
| audit, review, security, permissions | chrome-extension-builder-audit |
| test, verify, validate, or any stale evidence | chrome-extension-builder-testing |
| popup, layout, design, polish, accessibility, onboarding | chrome-extension-builder-ux-design |
| otherwise | the earliest unfinished step: design goes to ux-design, test to testing, release to prepare-release, anything else to build |

Unresolved decision conflicts come first as blockers.

## 5. Brief and next-task handoff

Export the plan as Markdown using [context-handoff.md](templates/context-handoff.md): name, next task (skill, action, blockers), single purpose, product/surface/backend, permissions to justify, exact hosts, data boundaries (local: page data → validated messages → local storage; connected: page data → validated messages → authenticated API → authorized account storage, plus retention, deletion, consent, retries and offline), declared progress with stale count, scoped context fields, evidence records with their freshness, and the closing line "This handoff is a local review artifact, not live browser, scheduler, deployment, or store proof."

Escape user-entered text as described in [project-record.md](project-record.md) section 9 before placing it in the brief. Never include secrets, customer data or credential-bearing URLs in a plan.
