# Interactive workflow and evidence contract

The plugin guides work through chat and an optional local Studio. Its specialist files are runnable instructions for a capable host; their existence does not prove an agent ran or that a backend is deployed.

## Persistent project artifacts

Use the target project's conventions; these suggested artifacts make resuming work straightforward. When dispatched through skills/chrome-extension-builder/references/team.json, its assigned report paths take precedence: place the equivalent content in those paths and link any additional implementation documents. Do not create competing authoritative reports for the same role.

| Artifact | Contents | Owner |
| --- | --- | --- |
| docs/extension-contract.md | Purpose, audience, sites, surfaces, data, permission rationale, costs, acceptance | Orchestrator |
| docs/research.md | Dated links, facts/inferences, feasibility, competitors, assumptions | Research |
| docs/architecture.md | Context/data flow, modules, storage, messages, stack, compatibility | Architecture |
| docs/ux-spec.md | Journey, states, tokens, interactions, accessibility | UX |
| docs/backend-contract.md | API/auth/ownership, limits, env names, migration, deployment | Backend |
| docs/integrations.md | Provider/site boundary, consent, canary, fallback | Integration |
| docs/security-review.md | Finding, severity, evidence, fix, residual risk | Security |
| docs/qa-report.md | Artifact/browser identity, cases, screenshots, passes/failures/unrun | QA |
| docs/performance.md | Baseline, budgets, repeated measurements, regression | Performance |
| docs/candidates.md | Gates, rubric, candidates, selected tradeoffs, stop reason | Evaluator |
| docs/release.md | ZIP digest, asset checklist, deployment/submission/status | Release |
| docs/maintenance.md | Version matrix, migrations, incidents, next action | Maintenance |

Keep one concise status record: current stage; completed evidence; active task; unresolved assumptions; user choices and authorization; next dependency; external gates. Never put secrets or full private logs into this record. Resume the active objective when the user says continue, refines scope, asks status, or supplies a missing value.

## Interactive checkpoints

At intake, show the inferred contract and at most three material decisions. After architecture/UX, show the primary journey and chosen stack/surfaces with costs and data boundaries. During build, show a working slice and representative states. During QA, report verified behavior and concrete defects. At delivery, show the source, package, evidence, and remaining external gates.

Questions are for choices that materially change the product or lack authorization. Do not ask permission for routine local reversible work already requested. Do not require a keyword to continue. Missing optional answers can use a clearly stated reasonable default; required authorization cannot be inferred from time passing. Before deployment/charges/submission lacking authorization, complete the concrete reviewable preparation first.

## Team and dependency graph

Read skills/chrome-extension-builder/references/team.json at the plugin root; dispatch only roles needed for the current stage. Assign explicit file ownership and common schemas. Architecture/UX establish contracts before frontend/backend parallel work. Security participates early and reviews final output. QA/performance require a built artifact. Release requires the relevant gates; debugging rejoins QA. When collaboration is unavailable or not authorized, the main agent executes the same distinct role passes and discloses the mode.

## Truthful completion

Record an observed result against an exact source tree/artifact and environment. `Pass`, `fail`, `not run`, and `not applicable` are distinct. Source review is not browser runtime proof. Browser automation in Chromium is not manual branded-Chrome behavior. A working localhost API is not production deployment. A prepared listing is not submission; submission is not acceptance. Do not turn a mockup, generated scaffold, checklist, simulated score, or unobserved agent claim into shipped evidence.
