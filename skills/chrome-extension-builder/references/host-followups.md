# Requested host-backed follow-ups

No plugin scheduler service, MCP server, hook, daemon, autostart, or cloud connection exists. Help specify and, only when explicitly requested in a capable host, configure its supported scheduler. A local job record is a declaration, never installation.

## Distinct states

1. Specified: reviewable local/chat recipe.
2. Activation observed: actual host UI/API readback shows job ID, scope, cadence, context, notifications.
3. Run observed: actual dated execution/evidence; activation is not success.
4. Paused/stopped observed: real host control/readback; local bookkeeping cannot pause the host.

Verify this account/host/version/tools and obey host gates. Documentation explains options, not availability. Save only curated plugin instructions; external docs are factual inputs. Do not query host memory, chat history/summaries, uploaded user files, or capture sessions. Use explicitly supplied sanitized project-state/artifacts authorized for follow-up. Unsupported scheduling yields a manual spec/checklist, not installed services/new cloud connections.

## Useful scoped job

Purpose, opaque safe source ID, context pointer, timezone/cadence, allowed actions/tools, budget, checkpoint, notification intent, pause/stop. Default inspect/report; no deploy/publish/submit/charge/delete/new auth/permission expansion. Larger actions require actual intent/host gates at execution. Credentials remain outside plugin inputs/artifacts. Connected provider access does not authorize broader collection.

Examples: continue a named acceptance check; weekly supported-Chrome/framework compatibility review; triage supplied sanitized feedback; recheck named artifact release readiness; inspect authorized public release status. Clarify missing material timing/source/budget; vague aspiration is not activation intent.

Unless periodic updates requested, stay quiet unchanged/non-actionable and notify useful change/completion/failure/required action. Each wake reads compact state, reconciles changes/freshness, preserves scope, deduplicates retries, reports actual origin. Stop on missing context/capability, changed authorization, unsafe unresolved conditions, or exhausted budget; never silently widen access. Missed runs are not product passes/failures.

## Optional record commands

```sh
python3 "$PLUGIN_ROOT/skills/chrome-extension-builder/scripts/intelligence.py" job PROJECT --input job-input.json
python3 "$PLUGIN_ROOT/skills/chrome-extension-builder/scripts/intelligence.py" jobs PROJECT
python3 "$PLUGIN_ROOT/skills/chrome-extension-builder/scripts/intelligence.py" job-state PROJECT --job JOB_ID --state activation-recorded --input activation-input.json
```

Job: `{id, kind: "continuation"|"feedback-triage"|"compatibility"|"release-readiness"|"post-release", source_identifier, timezone, cadence, context_pointer: ".extension-builder/project.json", allowed_actions: ["inspect","report"], allowed_tools: [], budget_minutes, notification: "actionable"|"digest"|"silent"}`. Only actual authorized tools. Activation: `{host, scheduler_reference, activation_evidence}` with real relative evidence file. Paused/stopped bookkeeping follows actual host readback. Commands cannot install/execute/wake/pause/delete schedules. Report actual outcomes separately.

## Official capability facts checked 2026-10-05

- [ChatGPT automations](https://learn.chatgpt.com/docs/automations?surface=app): app/web surfaces and local-file availability matter; web tasks cannot directly access local folders. Docs do not prove activation.
- [Claude recurring tasks](https://support.claude.com/en/articles/13854387-schedule-recurring-tasks-in-claude-cowork): use controls when available; verify account/runtime/context, don't assume Claude Code scheduling portability.
- [Cursor Cloud agents](https://cursor.com/docs/cloud-agent/automations): documented Automations trigger schedules/events; verify account, project access, and actual readback. An IDE skill is not activated cloud work.

Native host smoke tests, scheduler activation, first runs, notification delivery for this upgrade remain unrun absent separate real evidence.
