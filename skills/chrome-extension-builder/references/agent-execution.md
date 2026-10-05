# Execute the useful task

Inspect the existing extension and current task before initializing records, choosing frameworks or asking questions. A repair needs a failing reproduction and the affected context; a first build needs one useful interaction and acceptance criteria. Project bookkeeping and scaffold metadata are not implementation.

## Local prerequisites and receipts

Resolve the main skill's actual installed directory. Its contained launcher is `scripts/extension_builder.mjs`. Node18+ and Python3.10+ are required only for local helpers; chat planning and code artifacts need neither an account nor a local runtime. Do not silently install global tools.

```sh
node scripts/extension_builder.mjs --json doctor
node scripts/extension_builder.mjs --json check ./dist
node scripts/extension_builder.mjs --json session status ./project
node scripts/extension_builder.mjs --json intelligence show ./project
```

The prefix `--json` enables schema1 execution receipts for scaffold/check/package/session/intelligence. Legacy command arguments remain supported. Doctor lists actual helper presence and runtime versions without project access or network calls. Interactive Studio uses the ordinary manual `studio` command; it cannot run inside the bounded receipt mode. Read individual command help without the JSON prefix.

Receipts include helper version, unique invocation ID, operation, state, actual outputs, verification level, safe error, next action and explicit browser/scheduler/publication limits. This invocation ID is not a provider idempotency key. Inputs are limited to50 arguments,2000characters each,16000 total, plus each helper's project-file bounds. Execution is bounded to30seconds and8MiB per output stream after a3second runtime probe. Diagnostics never appear beside structured stdout. No automatic retry occurs.

Use error codes rather than matching arbitrary diagnostics: RUNTIME_NOT_FOUND and RUNTIME_UNSUPPORTED, RESOURCE_MISSING, PROJECT_NOT_FOUND/NOT_INITIALIZED, FILE_NOT_FOUND, ACCESS_DENIED, PATH_REJECTED, STATE_BUSY/CONFLICT/INVALID, EVIDENCE_STALE, OUTPUT_EXISTS, INVALID_ARGUMENT/INPUT, CHECK_FAILED, LOCAL_IO_FAILED and OUTCOME_UNKNOWN. An error does not establish absence of local changes; inspect current state and output before repeating a write. A timeout or truncated output is unknown, never safe replay. Preserve malformed state and useful partial artifacts.

## Route and finish

Build → inspect source, define one journey, implement it, run relevant checks. Fix → reproduce current behavior, change the smallest affected code, regression plus browser check. Audit → scope findings and evidence; repair when authorized. Improve → preserve direction and measure the affected change. Import/resume → reconcile source identity, accepted choices, conflicts and stale evidence; continue the earliest unsatisfied task. Release → check/package the actual framework build with manifest.json, then separate native browser, backend and Store gates.

Studio Continue recommends a view and skill from supplied task records; it does not execute their text. Export next task creates a compact scoped handoff with accepted choices, blockers, evidence identities and one next action. Review it against current files and authority. Neither a declaration nor an imported verified label proves current browser execution.

For worker/message problems, test the exact build after worker termination/restart; validate sender and payload, persistent state and safe retries. For content scripts, check declared-site matches and page trust boundaries. For permissions, include denied/revoked access and recovery. A website preview cannot stand in for these Chrome API checks. If browser control cannot load an extension or a supported automation runtime is absent, report that precise gate and leave executable steps and a synthetic fixture rather than inventing a pass.
