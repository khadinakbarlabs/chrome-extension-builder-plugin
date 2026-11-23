---
name: chrome-extension-builder-studio
description: "Review a Chrome extension plan visually or export its next-task handoff. Start the optional local planning Studio only when requested; it does not build extensions or execute agents."
---

# Chrome Extension Builder: Studio

Before starting, read [policy boundaries](../chrome-extension-builder/references/policy-boundaries.md). Accept only a sanitized brief and explicit choices, never secrets/restricted records.

In chat, guide purpose → audience → local/cloud/hybrid → surfaces → sites/data/permissions → acceptance. Present editable choices and a reviewable normal Markdown plan. Use [chrome-extension-builder](../chrome-extension-builder/SKILL.md) for substantive work. A useful planning result requires no local server or persistent settings.

Run the guided steps, checks, candidate table and next-task routing in [planning-steps.md](../chrome-extension-builder/references/planning-steps.md). This directory edition is text-only: the visual local Studio (browser UI and loopback server) ships only in the full edition from the GitHub repository. If the user asks for the visual Studio, say so plainly and continue the chat flow; start no server, MCP UI, or cloud connection.

Offer the plan as an exportable Markdown brief and next-task handoff using [context-handoff.md](../chrome-extension-builder/references/templates/context-handoff.md); nothing is remembered between chats unless the user saves it or authorizes the local project record. Studio checkboxes/scores are declarations, not executed tests or independent agents. Exit with a usable brief, chosen tradeoffs, and next workflow.

## Context and outcome handoff

Planning outputs are provisional declarations until supported by actual artifact evidence. Use [project context](../chrome-extension-builder-context/SKILL.md) to retain confirmed choices and [report](../chrome-extension-builder-report/SKILL.md) to label prototypes versus real captures. Candidate weights stay frozen across rounds; exported plans do not execute agents or activate jobs. Preserve the canonical report destination assigned by `references/team.json`; any overview is a dated view, not a competing authority.
