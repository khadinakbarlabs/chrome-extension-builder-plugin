# Claude directory review notes

Version 2.2.5 replaces the mixed 2.2.1 package with a native Claude edition. Its 19 skills, 12 text agents and five commands remain; all `skills/*/agents/openai.yaml` files and the source-only plugin release helper are excluded. The native directory icon is supplied in the package. No MCP, hooks, credential configuration, automatic service, or installer is declared.

The earlier 19 image-reference findings named OpenAI metadata that is no longer in this version. This is a source correction; only a fresh directory scan can confirm the new result.

The extension checker and local Studio are retained because they are useful capabilities. They neither collect installer credentials nor send them to a server. `check_extension.py` scans a user-selected extension directory, rejects sensitive filenames before reading, and uses import/export and HTTPS patterns to detect unsafe extension code and broad permissions. `studio/model.mjs` contains JavaScript module exports, object-field keys and HTTPS host-pattern validation; it has no process-environment credential read or network request. Do not weaken these controls to suppress a heuristic finding.

The core workflow works in conversation without local execution. Optional helpers require available host tools and are manually invoked. Studio binds loopback; plans remain in browser memory by default, localStorage is opt-in, and explicit exports remain with the user. Requested research uses enabled host tools with scoped queries; host retention is independent. There is no plugin-hosted service retaining data. See [Privacy](../PRIVACY.md) and [Support](../SUPPORT.md).

Public branding follows the selected release artwork and its rights requirements. The plugin is an independent tool for adult developers. Structural checks, helper tests and archive integrity do not establish semantic model behavior across Claude surfaces or guarantee approval. Anthropic's observed scan and reviewer decision govern directory eligibility.
