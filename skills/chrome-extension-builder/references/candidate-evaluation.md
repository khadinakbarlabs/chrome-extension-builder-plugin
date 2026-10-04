# Bounded evolutionary improvement

This workflow borrows candidate generation, variation, fitness evaluation, and selection from evolutionary search. It is a practical design review method, not biological engineering or proof of global optimality. Use it when alternatives could materially improve the product; skip it for obvious small repairs.

## Finite protocol

Freeze the target/acceptance constraints and record a measured incumbent. Default: at most three candidates per round and three rounds. Generate candidates from this actual project's observed pain and constraints, using curated task recipes/defaults where they fit; do not substitute generic simulated candidates. Variation changes one meaningful dimension (surface/layout, context boundary, storage strategy, build framework, or performance technique). Preserve the approved purpose, permission/data boundaries, deployment authorization, and compatibility. Compare artifacts without destroying the incumbent.

Reject before scoring: broken core acceptance, critical/high security issues, leaked private secrets, covert collection/transmission, remote executable payloads, deceptive UI, inaccessible critical journey, unauthorized costs/external actions, or unproven feasibility of a critical dependency. Unknown material gates remain blocked; no score can override them.

Canonical starting rubric from skills/chrome-extension-builder/references/team.json; use the same keys and weights across Studio, agent reports, and this reference. Freeze acceptance, these keys/weights, measurement definitions, and incumbent artifact before any scoring; keep them unchanged across rounds. Any requested new rubric begins a separately labeled comparison, not an inflated improvement against the old baseline:

| Dimension | Weight | Evidence |
| --- | --- | --- |
| task_success | 25 | Core journey, acceptance scenarios, useful outcomes |
| security_privacy | 20 | Threat tests, data inventory, manifest, grant/deny/revoke |
| usability_accessibility | 20 | Keyboard/focus, state coverage, clarity, representative fixtures |
| architecture_reliability | 15 | Lifecycle recovery, contracts, migrations, maintainability |
| test_evidence | 10 | Exact artifact/browser identity, repeatable cases, honest unrun gates |
| performance_cost | 10 | Repeated timings, page/memory/network impact, verified pricing assumptions |

Use 0–5 per dimension and `sum(weight × score / 5)` for a 0–100 result. Mark each score as measured, reviewer judgment, or unknown. Do not invent measurements. Actual cost estimates disclose usage assumptions and price date. Rank only candidates passing hard gates and meeting material acceptance; prefer simpler designs and retain incumbent on ties or evidence-free improvement.

Independent evaluator sees the same contract/rubric and can reject any candidate. If independent collaboration is unavailable or not authorized, use a separate critique pass and state its limit. Refinement targets observed weaknesses and may combine compatible winning components; test the combined result again because inherited scores do not transfer automatically.

Stop when acceptance passes and benefit is demonstrated, two successive evaluations show no meaningful improvement, the round budget is exhausted, or a material decision is needed. Select a useful verified winner or state a recommendation and concrete remaining gate. Deliver baseline, candidates, gate outcomes, rationale/evidence, score table, round count, stop reason, implementation, and final regression result in docs/candidates.md.

Feedback can identify a hypothesis to test but does not establish benefit. Distinguish agent judgment, measured acceptance/performance, and actual human usefulness. Human sessions, scheduled runs, and retries have separate identities/counts. A 10x aspiration or a higher score cannot establish real-world improvement without comparable evidence.
