# Claude directory reviewer notes

Prepared 2026-10-02 for version 2.2.1. Initial portal validation at commit e78ae7d passed with one missing-icon warning and 22 policy holds. A hold is pending human review, not approval. Icon metadata was then added and needs fresh validation.

The package has 19 skills, 12 optional Claude-native text agents and five commands. It has no MCP server, hooks, automatic services, credential intake or background telemetry. The optional Studio is manually launched on loopback, with browser memory by default and explicitly opted-in localStorage. User-exported plans and generated project files remain local until the user separately shares them. Host conversation retention is independent. See PRIVACY.md.

## Image metadata holds

Nineteen findings point to skills/*/agents/openai.yaml naming skills/chrome-extension-builder/assets/icon.png. These are presentation metadata for the optional OpenAI adapter. scripts/release_plugin.py reads YAML existence/content during local source/package validation and copies assets into an archive; it does not invoke YAML or image bytes through a shell or interpreter. No command or hook executes an image. A square PNG at .claude-plugin/icon.png supplies the native listing icon through directory discovery.

## Credential-related holds

- skills/chrome-extension-builder/scripts/check_extension.py: HTTPS wildcard literals are patterns for detecting overly broad Chrome host permissions. import/export expressions are JavaScript-pattern checks. The checker does not read process environment credentials or send network requests. It inspects only the user-selected extension directory and rejects sensitive filenames before reading them.
- studio/model.mjs: export declares JavaScript module exports. The HTTPS expression validates host-pattern input; key variables refer to object fields. The module is a local planning model and contains no environment credential read or network request.
- scripts/release_plugin.py: .npmrc and other credential-like filenames are a denylist. selected_files rejects them before loading bytes, rejects symlinks and private directories, and then reads only selected distribution files. This prevents inclusion of credentials; it does not collect installer credentials. No hosted upload is performed by this helper.

These source explanations ask for an accurate reviewer decision; they do not override the scanner or establish that Anthropic has cleared the holds. Required scanner findings and legal attestations remain outstanding until observed.

## Supported core prompts

1. Plan a consent-based reader helper for explicitly selected text on an authorized test site; choose surfaces, scoped permissions, accessible states, message contracts and acceptance cases.
2. Design an extension with a cloud-app companion using synthetic accounts and placeholder provider configuration; keep privileged values outside extension code and mark real auth/API tests unrun.
3. Audit a supplied sanitized extension fixture, report concrete findings, and prepare its package/listing checklist while separating static checks, browser QA and store acceptance.

Local tests passed 34 cases (29 Python and five JavaScript). A real host probe is tracked separately; these prompt examples are supported intents, not claims that all semantic scenarios or all Claude surfaces passed. No reviewer account is required because this bundle has no plugin account or remote service.

## Branding and publication

The publisher explicitly selected the original custom browser/extension mark without Google's logo for public distribution on 2026-10-02. Both referenced icon copies and .claude-plugin/icon.png use that original asset. The public repository starts with clean history and includes no Chrome-logo image bytes. The separate private preparation repository and canonical source preserve the prior user-selected composite image.

Google Chrome is a trademark of Google LLC. This is an independent plugin. MIT licensing of the plugin code does not grant third-party trademark rights.

The publisher confirmed conservative data disclosures: reads/stores user-supplied project information in optional local files/storage; requested research may send scoped queries through enabled host tools; no plugin-hosted service retains data; intended for adult developers. The actual portal declarations and the four legal acknowledgements still need final completion. A live Claude Code model probe was blocked by expired OAuth authentication; it is not semantic pass evidence.
