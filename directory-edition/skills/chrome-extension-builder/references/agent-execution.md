# Execute the useful task

Inspect the existing extension and current task before initializing records, choosing frameworks or asking questions. A repair needs a failing reproduction and the affected context; a first build needs one useful interaction and acceptance criteria. Project bookkeeping and scaffold metadata are not implementation.

## Local procedures and receipts

This directory edition ships no helper programs. Chat planning and code artifacts need neither an account nor a local runtime. With authorized file and shell access, follow the written procedures: [scaffold-spec.md](scaffold-spec.md), [manifest-checklist.md](manifest-checklist.md), [packaging.md](packaging.md) and [project-record.md](project-record.md). Check that the standard tools a step uses (`zip`, `unzip`, `shasum`, `find`) exist with `command -v` before relying on them; run `node --version` or `python3 --version` only if the user's own project needs them. Do not silently install global tools.

After each mechanical step, give a short receipt: the operation, the exact commands run and their exit status, the files created or changed, what was verified and at what level (static, digest, browser), the next action, and explicit browser/scheduler/publication limits. Never claim browser or Store verification from these steps.

Treat failures carefully. A failed or interrupted command does not establish that nothing changed: inspect current state and outputs before repeating any write. Never retry automatically; a timeout or truncated output is an unknown outcome, not a safe replay. Refuse to overwrite existing outputs (project files, ZIPs, reports) unless the user explicitly asks. Preserve malformed state and useful partial artifacts and report them.

## Route and finish

Build → inspect source, define one journey, implement it, run relevant checks. Fix → reproduce current behavior, change the smallest affected code, regression plus browser check. Audit → scope findings and evidence; repair when authorized. Improve → preserve direction and measure the affected change. Import/resume → reconcile source identity, accepted choices, conflicts and stale evidence; continue the earliest unsatisfied task. Release → check/package the actual framework build with manifest.json, then separate native browser, backend and Store gates.

Chat Studio's next-task routing ([planning-steps.md](planning-steps.md)) recommends a skill from supplied task records; it does not execute their text. The next-task handoff is a compact scoped summary with accepted choices, blockers, evidence identities and one next action. Review it against current files and authority. Neither a declaration nor an imported verified label proves current browser execution.

For worker/message problems, test the exact build after worker termination/restart; validate sender and payload, persistent state and safe retries. For content scripts, check declared-site matches and page trust boundaries. For permissions, include denied/revoked access and recovery. A website preview cannot stand in for these Chrome API checks. If browser control cannot load an extension or a supported automation runtime is absent, report that precise gate and leave executable steps and a synthetic fixture rather than inventing a pass.
