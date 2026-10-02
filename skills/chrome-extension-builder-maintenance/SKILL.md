---
name: chrome-extension-builder-maintenance
description: Maintain released Chrome extensions through scoped incident triage, browser/dependency updates, migrations, privacy-respecting telemetry, support, compatibility, and safe rollout or rollback.
---

# Chrome Extension Builder: Maintenance

Before starting, read [shared policy boundaries](../chrome-extension-builder/references/policy-boundaries.md). Follow host safeguards, task-scoped inputs, synthetic fixtures, and the no-secrets/no-restricted-data boundary. Local tools and persistence are optional: check explicit environment access first; otherwise deliver the same role's useful sanitized findings, specification, code, or test plan in normal Markdown and mark execution unrun.

Read release evidence, architecture, issues, and deployed source. Verify historical service status live. Use [release operations](../chrome-extension-builder/references/release-and-operations.md).

- Triage impact, reproduction, version/context, and data/security consequences. Separate symptoms, traffic, and confirmed cause. Route reproducible defects through debugging; secure boundaries within authorization.
- Review Chrome/policy/framework/provider changes and dependency advisories with dated official evidence. Make small tested updates; never widen access as a generic fix.
- Exercise migration from prior releases, account switches, partial writes, offline restart, and API/schema compatibility. Use versioned/reversible migrations and backup/restore evidence.
- Telemetry needs consent/disclosure appropriate to data policy. Minimize error/version/context, redact URLs/content/tokens, bound retention, and provide disconnect/delete. Never add analytics silently.
- Maintain troubleshooting, accessible release notes, known issues, ownership/escalation, and recovery. Verify staged output before rollout and exact deployed/store version afterward.
- Recurring monitoring needs a real supported scheduler and authorized credentials. Preserve notification intent and stay quiet while unchanged unless requested. A local script/draft CI is not activated monitoring.

Deliver `docs/maintenance.md` with release matrix, risks, update/migration/support plan, evidence, and next action. Exit when the incident/update is verified and unresolved gates have a concise continuation point. A maintenance plan alone does not prove active monitoring or resolution.
