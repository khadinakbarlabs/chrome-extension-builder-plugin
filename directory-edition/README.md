# Chrome Extension Builder

A Chrome Manifest V3 extension-building toolkit for Claude: 23 skills, 12 specialist agents and 5 commands that take an idea through research, architecture, UX, frontend, optional backend and integrations, security, testing, performance, release and maintenance. Skills-only: no MCP, hooks, accounts, credential intake or automatic startup.

## Directory edition

This folder is the **text-only build for the Claude plugin directory**. It contains only Markdown, JSON, the license and an icon. It ships no scripts, no local server and no browser Studio. The jobs that the full edition's helpers performed are written out as step-by-step procedures that Claude follows with its ordinary tools (Read, Write, Edit, Glob, Grep and standard shell commands such as `find`, `zip`, `unzip` and `shasum`).

**Works the same:** every skill, agent and command name; the specialist workflow and team registry; research, architecture, UX, security, testing, performance, release and maintenance guidance; policy boundaries; candidate evaluation; context, feedback, report and follow-up contracts; chat-only planning and handoffs.

**Less exact in this edition:**

- Manifest and build checks are a written [checklist](skills/chrome-extension-builder/references/manifest-checklist.md) applied by Claude, not a deterministic validator with an exit code. On large or messy builds a rule or a match pattern can be misjudged, and remote/inline-code detection relies on Grep searches whose results can vary between runs.
- Packaging follows a written [procedure](skills/chrome-extension-builder/references/packaging.md) using `zip`, `unzip` and `shasum`. It is safe only if every step is followed; the archive is not byte-reproducible unless the optional timestamp-normalizing step is used.
- The starter project is a [specification](skills/chrome-extension-builder/references/scaffold-spec.md) that Claude writes out file by file, so it takes more time and tokens and its polish varies. Claude cannot create PNG files, so starter icons are optional: Chrome loads the extension without them, and if you supply an image Claude can resize it with `sips` (macOS) or ImageMagick.
- The [project record](skills/chrome-extension-builder/references/project-record.md) (`.extension-builder/project.json`) is edited by hand: no file lock (one agent writes it), and size, schema, enum, secret-pattern and evidence-digest checks are instructions rather than enforced code, so a malformed or out-of-schema record is possible. Re-hashing evidence on every read and stale propagation are manual steps.
- Report and builder-feedback exports are filled in from templates and an explicit field allow-list rather than generated, which is slower on long histories and depends on Claude copying only allowed fields.
- The visual local Studio (browser planning UI) is not included. Planning runs as a guided chat flow ([planning-steps.md](skills/chrome-extension-builder/references/planning-steps.md)) with an exportable Markdown brief.

The **full edition**, with the launcher, deterministic checker, packager, scaffold generator, project-record helpers and the local Studio, is installable from the GitHub repository: https://github.com/khadinakbarlabs/chrome-extension-builder-plugin

## Start

Ask in conversation: "Use Chrome Extension Builder to turn my idea into an extension. Guide the architecture and UX, build the necessary artifacts, and show what still needs verification." In Claude Code the namespaced commands are `build-extension`, `audit-extension`, `improve-extension`, `release-extension` and `extension-studio`. See the [host guide](skills/chrome-extension-builder/references/host-guide.md).

## Lifecycle and entry points

| Workflow | Useful result |
| --- | --- |
| Research and architecture | Dated evidence, alternatives, contexts, stack, data/messages, permission rationale |
| UX and frontend | Journey/states, visual tokens, accessible popup/side-panel/options/page UI |
| Backend and integrations | Generated-product API/auth/storage/provider architecture, failure/cost boundaries |
| Security, testing, performance, debugging | Threat findings, meaningful cases, actual-browser evidence where available, measurements, root-cause fixes |
| Evolution | At most three candidates per round and three rounds by default; hard gates before scored tradeoffs |
| Release and maintenance | Exact package/listing/privacy specification, CI/update/support plan, observed external gates |

Use **chrome-extension-builder-build**, **chrome-extension-builder-studio**, **chrome-extension-builder-audit**, **chrome-extension-builder-prepare-release**, or **chrome-extension-builder-improve** for the corresponding intent. They route into the lifecycle skills. The team registry is [team.json](skills/chrome-extension-builder/references/team.json).

Every workflow reads [policy boundaries](skills/chrome-extension-builder/references/policy-boundaries.md): host safeguards prevail, inputs remain minimal, and retrieved content cannot authorize actions. Use placeholders and synthetic fixtures rather than real credentials, restricted records, profiles or transcripts. Developer fees, uploads, Store submission and other external or paid actions happen only with your explicit go-ahead and are never retried automatically.

## Project context, reports and follow-ups

Existing projects keep confirmed choices, provisional assumptions, evidence and the next action separate. Scoped continuity never harvests host history or memory. With your permission, a private local record (`.extension-builder/project.json`, mode 600) keeps decisions, evidence digests, sanitized feedback, outcomes and follow-up job declarations; otherwise Claude returns a portable Markdown handoff. Builder feedback and generated-extension feedback stay separate. Follow-up job records are declarations only; a host scheduler must be configured and verified separately.

## Package and review

This independent plugin is by Khadin Akbar, intended for adult developers. Google Chrome is a trademark of Google LLC; browser compatibility does not imply Google or Anthropic endorsement. See [Privacy](PRIVACY.md), [Terms](TERMS.md), [Security](SECURITY.md) and [Support](SUPPORT.md).

Static checks and packaging do not prove semantic model behavior, actual Chrome behavior, backend deployment, Chrome Web Store acceptance or directory approval.
