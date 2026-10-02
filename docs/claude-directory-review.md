# Claude directory review notes

Version 2.2.6 replaces the mixed 2.2.1 package with a native Claude edition. Its 19 skills, 12 text agents and five commands remain; all `skills/*/agents/openai.yaml` files and the source-only plugin release helper are excluded. The native directory icon is supplied in the package. No MCP, hooks, credential configuration, automatic service, or installer is declared.

The earlier 19 image-reference findings named OpenAI metadata that is no longer in this version. This is a source correction; only a fresh directory scan can confirm the new result.

The extension checker and local Studio are retained because they are useful capabilities. They neither collect installer credentials nor send them to a server. `check_extension.py` scans a user-selected extension directory, rejects sensitive filenames before reading, and uses import/export and HTTPS patterns to detect unsafe extension code and broad permissions. `studio/model.mjs` contains JavaScript module exports, object-field keys and HTTPS host-pattern validation; it has no process-environment credential read or network request. Do not weaken these controls to suppress a heuristic finding.

## Credential finding: reviewer evidence

The observed directory code is `MCP_FORWARDS_CREDENTIAL_ENV`. This package contains no MCP configuration or outbound credential transport. No `user_config` credential field is needed because the plugin does not accept or forward credentials. Adding one would introduce a new sensitive-data input rather than fix existing behavior.

| Flagged file | Actual behavior and boundary |
| --- | --- |
| `skills/chrome-extension-builder/scripts/check_extension.py` | Reads the explicitly selected extension build, parses its manifest and checks local client-source assets. Environment/credential filenames in the code are deny rules, never lookup instructions. Known credential-cache roots are refused before reading a manifest; sensitive directories are pruned before descent and sensitive files are rejected before reading. No process-environment credential lookup or HTTP transport is implemented. Findings contain paths and validation messages, not file contents. |
| `studio/model.mjs` | Pure transforms of explicitly supplied planning data. HTTPS patterns validate proposed host permissions; they do not make requests. The unsafe client-secret candidate stays rejected. The actual ES module is exercised in a restricted context with no process, environment, filesystem, imports or transport APIs. |
| `.claude-plugin/plugin.json` | Identity, version, description, publisher, license, keywords and repository/homepage metadata only. No `mcpServers`, hooks, installer command, environment mapping, request headers or credential input is declared. The `$schema` URL identifies the manifest schema; it is not an executable credential request. |

Regression fixtures use synthetic data. They verify that credential-cache files and `.env`/Cloudflare `.dev.vars` variants are never opened, protected roots (including a `secrets` ancestor) are refused before manifest reads, findings do not contain protected contents, and packaging fails without creating an archive. The packager independently applies the same exclusions when enumerating files. The Studio test verifies representative paths of the actual module in a restricted context; it is not a security sandbox for hostile code. Source evidence is not a directory clearance claim: the refreshed scan and Anthropic reviewer determine whether this hold is cleared.

The core workflow works in conversation without local execution. Optional helpers require available host tools and are manually invoked. Studio binds loopback; plans remain in browser memory by default, localStorage is opt-in, and explicit exports remain with the user. Requested research uses enabled host tools with scoped queries; host retention is independent. There is no plugin-hosted service retaining data. See [Privacy](../PRIVACY.md) and [Support](../SUPPORT.md).

Public branding follows the selected release artwork and its rights requirements. The plugin is an independent tool for adult developers. Structural checks, helper tests and archive integrity do not establish semantic model behavior across Claude surfaces or guarantee approval. Anthropic's observed scan and reviewer decision govern directory eligibility.
