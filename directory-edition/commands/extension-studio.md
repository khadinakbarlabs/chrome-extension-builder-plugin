---
description: Open the interactive planning studio and turn its brief into an actionable extension build session.
argument-hint: [project path or extension idea]
---

Use the `chrome-extension-builder` skill for this request: $ARGUMENTS

In this edition the studio runs in chat; the visual browser Studio ships only in the full edition from the GitHub repository. Follow `${CLAUDE_PLUGIN_ROOT}/skills/chrome-extension-builder/references/planning-steps.md` and the `chrome-extension-builder-studio` skill. Do not start any server.

Help the user select local/cloud/hybrid mode, main surface, permissions/data expectations and project scope. Use progressive questions, show choices as short tables and keep a running, editable Markdown brief. Explain that checklist ticks and candidate scores are declarations, not executed tests, independent agents, cloud backends or Store listings.

When the user requests a build, transfer the brief to the orchestrator's complete workflow and, if local files are authorized, record evidence in the real project record described in `references/project-record.md`.

Report the brief, the chosen trade-offs and the concrete next action, and offer the brief as a Markdown handoff the user can save.
