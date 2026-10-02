# Privacy

Last updated: 2026-10-02. This describes Chrome Extension Builder's skills-only package and optional local planning/tools. The public Claude package publishes this policy in its source repository; public accessibility is verified separately before submission.

The plugin has no hosted account service, MCP server, credential intake, checkout, telemetry client, or transcript collector. It runs as instructions in the host chosen by the user. A host may process conversation and enabled-tool data under its own settings and policies; this document does not promise control over that independent retention.

## Data, purpose, recipients, retention, controls

| Category | Why it is used | Recipients/location | Retention and user control |
| --- | --- | --- | --- |
| Task brief, chosen sites/surfaces/permissions, architecture preferences, supplied sanitized snippets | Produce relevant design, code, review, and acceptance artifacts | User-selected host/model; enabled research tools only when used for the task | Host retention/settings apply; provide minimal inputs and use host deletion controls |
| Studio project name/purpose, local/cloud/hybrid choice, surface, permission list, domains, backend choice, stage/checklists/candidate/round | Interactive local planning | Browser memory on the user's device; the read-only local server serves assets rather than receiving the plan | Memory lasts for the page session; remembering is optional. Disable remembering or Clear plan to remove the saved browser copy; browser site-data controls also apply |
| Opted-in remembered Studio plan | Resume a plan on the same browser origin/port | Browser localStorage | No automatic expiry; retained until remembering is disabled, Clear plan/browser site-data deletion occurs, or browser storage is removed |
| Explicitly exported/imported JSON plan or Markdown brief | User-controlled handoff and recovery | User's chosen local download/file and any recipient the user shares it with | Remains until user deletes files/copies/backups; browser Clear plan does not remove downloads |
| Explicit local project files, generated source, selected evidence/report paths and hashes, stage timestamps/history, package entries | Optional scaffold, checking, packaging, or resumable local session | User-authorized local filesystem; no plugin upload endpoint | Persists until the user deletes the project/artifact or `.extension-builder` session state; backups/sharing remain the user's responsibility |
| Sanitized issue reproduction and versions the user chooses to share | Troubleshooting | The support channel the user selects; the public Claude package offers a GitHub issue tracker for sanitized reports | Recipient's published retention applies; do not send private logs or records |

The optional static server binds loopback and has no plan upload, arbitrary project-write endpoint, or cloud API. The current Studio assets make no telemetry/cloud calls. Normal browser/OS local networking and host tools have their own handling. Research may access official public websites through the user's enabled host; disclose task-relevant data transfer rather than assuming the plugin controls those services.

Do not enter or supply real credentials, access tokens, cookies, private keys, OTP/MFA codes, payment-card data, PHI, government IDs, customer datasets, private browser profiles, or transcripts. Use placeholders and synthetic fixtures. This is an input boundary, not a claim that free-text fields can automatically detect every sensitive value. Sanitize before submitting/importing/exporting.

Generated Chrome extensions and optional cloud backends are separate products. For example, the notes starter stores user-entered notes in its own browser storage. That generated behavior is not the plugin's Studio storage. Each product needs its own exact collection, recipient, retention, consent, export/delete, authentication, and privacy disclosures. Legitimate login/secret provisioning occurs in the product/provider's protected channels outside plugin intake.

No data is sold by the plugin or used for plugin advertising. Its local files do not establish public contact details or external legal acceptance. Verify published policy/support/terms/homepage URLs and the actual host/provider terms before directory release.
