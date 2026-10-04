# Outcomes and visual evidence

Lead with useful result and next action. Aggregate a dated view of canonical project state and `team.json` specialist reports, not a rival status authority. Normal Markdown is sufficient without tooling. Show concise user recap before evidence/detail.

| Work state | Meaning |
| --- | --- |
| Planned | Defined work; no implementation claim |
| Implemented | Source/artifact exists; behavior may remain unrun |
| Verified | Named acceptance observed against identified artifact/environment |
| Blocked | Specific unsatisfied dependency/authority/capability and next step |
| Not applicable | Explicit reason requirement doesn't fit |

Checks separately say pass/fail/stale/not run/not applicable. Deployment/store/submission/acceptance remain independent. A verified field is a recorded assertion; link its real evidence. Resolve missing proof/discrepancies before release recommendations.

## Visuals

Use tables for choices/state, Mermaid for small context/data/dependency diagrams if rendered, actual screenshots or supported prototypes when they clarify journeys. Provide text fallback. Never imply clickable host actions that are unsupported.

Label concept / interactive prototype / actual extension capture. Actual captures name artifact/build identity, browser/version, date, surface, synthetic fixture/state, source, and untested interaction. Redact private material. Static previews/screenshots don't prove Chrome APIs, backend integration, accessibility, worker restart, store acceptance, or cross-host execution. If capture unavailable, deliver annotated state spec and mark runtime visual evidence unrun.

Charts require actual dated observations, source, sample size, comparable definitions, and method. Separate measured time/cost from estimates. Never invent usage/satisfaction/performance/denominators. Count unique opaque human-session IDs when supplied; separate human/scheduled/retry outcomes. Missing IDs mean session count unknown. Wakeups aren't new customers.

## Optional helper

```sh
python3 "$PLUGIN_ROOT/skills/chrome-extension-builder/scripts/intelligence.py" outcome PROJECT --input outcome-input.json
python3 "$PLUGIN_ROOT/skills/chrome-extension-builder/scripts/intelligence.py" report PROJECT --kind session --output outcome-review
```

Kinds: session/project/feedback/scheduled. Emits JSON/Markdown from existing records, refuses overwrite unless authorized `--force`. Inputs/names follow live help, project-relative. It does not run tests, inspect hosts, or activate jobs.

Outcome: `{id, origin: "human"|"scheduled"|"retry", session_id?, intent, outcome: "useful"|"partly-useful"|"blocked"|"failed"|"unchanged"|"unrun", summary, changed: [], can_do_now: [], blocked: [], next_action?, evidence_ids: [], job_id?, parent_run_id?, input_fingerprint?}`. Opaque non-personal IDs only; no transcript/private URL/user identity.

See [template](templates/outcome-report.md). Deliver reviewable result, observed checks/limits, available next step, and genuinely missing decision. Host semantic evaluation, schedules, publishing, and usefulness gains remain unrun/unmeasured until observed.
