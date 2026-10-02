# End-to-end coverage and proof checklist

This checklist defines what the plugin guides, builds and verifies. It does not assert every generated project needs every capability. For each applicable item record the owner, artifact/build identity, observed evidence and pass/fail/unverified status; record a reason for not-applicable items. A clean scaffold/check is a baseline, not completed product behavior.

| Area | Required coverage when applicable | Owner and evidence |
| --- | --- | --- |
| Product research | User job/audience, current alternatives, explicit single purpose, distribution route, feasibility, risk and source dates | product-researcher: brief with primary-source links, must-have acceptance journeys and uncertainties |
| Project intake | Existing repository/product/brand, allowed paths, dirty changes, user authorization, reversible defaults, consequential missing choices | orchestrator: editable brief and session state |
| Architecture | Local/cloud/hybrid alternatives, contexts/lifetimes, typed versioned message/API contracts, storage/data model, minimum Chrome version, migration/rollback | extension-architect: ADR, diagram, contract and exclusive file ownership |
| Permissions | Minimum API/host access, activeTab vs persistent hosts, optional permission gestures, warnings/rationale, denied/revoked handling, incognito assumptions | architect + security-reviewer: permission inventory and granted/denied/revoked tests |
| Manifest/platform | MV3 manifest/version, valid paths/icons, CSP, local executable dependencies, web-accessible resources, externally_connectable, browser/API compatibility | frontend-engineer + QA: deterministic report and actual supported-browser load |
| Worker lifecycle | Top-level listener registration, suspension/restart, persisted state, idempotency, timeouts, bounded alarms/retries, safe upgrades | frontend-engineer + QA: restart/update/retry behavior evidence |
| Browser surfaces | Popup, side panel, options, onboarding, context menus/shortcuts/notifications/new tab only when useful; ephemeral popup state and persistent-task choice | ux-designer + frontend-engineer: complete UI-state inventory and task journeys |
| Content integration | Isolated-world boundaries, page data validation, exact host matches, SPA/history navigation, repeated injection cleanup, frames, Shadow DOM and style containment | frontend-engineer + QA: representative hostile/dynamic page fixtures and observed integration |
| Exceptional APIs | Offscreen reason/lifecycle, declarativeNetRequest rules/limits if needed, identity/capture/native messaging installer scopes and support burden | architect + integration-engineer: API rationale and compatible runtime test |
| UI/UX polish | Brand, hierarchy/tokens, readable density, loading/empty/success/error/recovery states, concise copy, consent, focus preservation, responsive/zoom behavior | ux-designer + frontend-engineer: visual spec, working preview and acceptance evidence |
| Accessibility | Semantic controls, keyboard flow, visible focus, labels/errors/announcements, contrast, zoom, reduced motion, assistive-technology checks | UX + QA: keyboard/contrast/zoom report and actual assistive evidence where available |
| Internationalization | chrome.i18n/locales/default locale, meaningful message keys, translated dynamic strings, locale-sensitive dates/numbers, pluralization, RTL/expansion/fallback | frontend-engineer + QA: localization contract and chosen-locale journey evidence |
| Local persistence | Storage area/access levels, quotas, migrations, concurrent updates/conflicts, import/export limits, retention/delete, offline behavior | architect + frontend-engineer: schema/migration and recovery tests |
| Authentication | Provider-supported flow, redirect allowlist, state/PKCE where applicable, lifetime/revocation, account switching, no public-client secret | backend/integration + security: exact scopes and auth rejection/expiry evidence |
| Cloud API | Strict inputs and outputs, authorization/tenant isolation, pagination, quotas/rate limits, idempotency, timeouts/cancellation, safe errors and CORS rationale | backend-engineer: API contract, behavioral/authorization tests and authorized exact-build canary |
| Database | Parameterized access, tenant constraints, indexes, least privilege, migrations/backups/rollback, retention/deletion/export | backend-engineer + security: schema, migration tests and isolation evidence |
| Queues/jobs | Demonstrated need, bounded retries, idempotency, deduplication, dead-letter recovery, status/cancellation and observability | backend-engineer: lifecycle/recovery tests and operations runbook |
| SaaS/AI/integrations | Current official docs, permission scopes, data transfer, schema/version validation, provider outage/quota, mock vs live distinction, AI output treated as data | integration-engineer: adapter contract, fixtures, cost assumptions and live evidence if authorized |
| Billing/entitlements | Pricing model, server-validated entitlement, signed webhook verification, retry/reconciliation, cancellation/refund/revocation states, accurate user copy | backend + security + UX: payment-state tests; no invented live-billing claim |
| Privacy/security | Threat model, page-message trust, safe DOM/URLs, no secrets/remote executable code, dependency provenance, consent/disclosure, sensitive data/log redaction | independent security-reviewer: actionable severity findings and verified remediation |
| Testing | Meaningful test-first logic/bug coverage, install/update, permissions, restart, auth/tenancy, offline and malformed data, navigation, locale/a11y, package root | qa-engineer: current-build pass/fail/unverified matrix and reproducible artifacts |
| Performance/cost | Page impact, startup/interaction latency, long tasks/memory, worker wakeups, storage/network volume, bundle size, server/provider cost budgets | performance-engineer: reproducible baseline and before/after measurements |
| Candidate evolution | Frozen criteria, max three candidates/round and three rounds, hard blockers, independently linked scores, early plateau exit, best verified retention | independent-evaluator: candidate matrix, findings and next-owner fixes |
| Developer experience | Understandable README, local setup, env placeholders, commands/tests, extension loading/debug steps, typed contracts and architecture context | implementation owners: fresh setup/check evidence; no secret sample values |
| Release packaging | Version/references, production endpoints, dependency/license inventory, excluded secrets/dev artifacts, root ZIP layout, size/hash, reproducible check | release-manager: actual archive inspection and exact-build reports |
| Store/distribution | Current listing/asset requirements, publisher identity, truthful single purpose, permission/data disclosures, privacy/support URLs, reviewer access/instructions, target visibility | release-manager: prepared materials and separately observed upload/review/publication/install state |
| Maintenance | Current-build incident reproduction, sanitized evidence, regression fix, dependency/API/policy updates, version/storage migration, rollback and support | maintenance-engineer: root-cause evidence, runbook, changelog and continuation handoff |
| Monitoring/growth | Opt-in/privacy-conscious events where justified, errors/health, cost signals, feedback/support, truthful experiments and actual scheduled activation | maintenance + research: measurement plan and observed activation when requested |

## Quality gates

1. **Contract ready:** research/architecture decisions are actionable; acceptance journeys and file ownership are explicit. Optional capabilities have a reasoned scope decision.
2. **Implementation ready:** the requested behavior exists, meaningful affected checks pass, and changes to data/permissions/interfaces are documented.
3. **Verification ready:** the exact build has appropriate independent security, runtime, accessibility and performance evidence. Missing extension/browser/provider tooling is unverified, never waived by a static pass.
4. **Package ready:** inspected root-layout ZIP, no hidden secrets/dev artifacts, complete assets and real source/build/check identity.
5. **Distribution observed:** distinguish the requested local/private/enterprise/Store route; only report upload, review acceptance, publication or installed-user proof after observing each.
6. **Continuation ready:** current status, unresolved blockers, artifact links and next owner are recorded without transcripts, secrets or customer content.

Privacy/security/policy violations and required unavailable runtime proof prevent claiming release readiness. A weighted quality score cannot override these gates. This checklist guides policy review; the checker cannot provide legal advice or Store approval. Consult the actual [Chrome Web Store program policies](https://developer.chrome.com/docs/webstore/program-policies/) and [publishing documentation](https://developer.chrome.com/docs/webstore/publish) at release time; last checked 2026-10-02.

## Interactive experience coverage

The local studio should give users editable progressive choices, clearly labelled local/cloud/hybrid paths, browser-surface choices, a visible specialist workflow, a usable brief/plan handoff, accessible controls and clear saved/exported state. Display actual checks separately from requested or planned work. The main conversation supplies recommendations, consequential questions, next action and concise evidence summaries. Neither a button nor a generated plan substitutes for implemented behavior or loaded-extension QA.
