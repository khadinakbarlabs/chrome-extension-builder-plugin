# Claude directory review notes

Version 2.3.0 replaces the mixed 2.2.1 package with a native Claude edition. Its 19 skills, 12 text agents and five commands remain; all `skills/*/agents/openai.yaml` files and the source-only plugin release helper are excluded. The native directory icon is supplied in the package. No MCP, hooks, credential configuration, automatic service, or installer is declared.

The earlier 19 image-reference findings named OpenAI metadata that is no longer in this version. This is a source correction; only a fresh directory scan can confirm the new result.

The extension checker and local Studio are retained because they are useful capabilities. They neither collect installer credentials nor send them to a server. `check_extension.py` scans a user-selected extension directory, rejects sensitive filenames before reading, and uses import/export and HTTPS patterns to detect unsafe extension code and broad permissions. `studio/model.mjs` contains JavaScript module exports, object-field keys and HTTPS host-pattern validation; it has no process-environment credential read or network request. Do not weaken these controls to suppress a heuristic finding.

## Credential finding: 2.3.2 changes

The observed directory code is `MCP_FORWARDS_CREDENTIAL_ENV`. This package declares no MCP server, hook, `userConfig` credential field or outbound credential transport, and it needs no credential to work. Version 2.3.2 removes the behavior and patterns that could be read as using credentials from the user's machine:

| Area | 2.3.2 behavior |
| --- | --- |
| Child processes (`extension_builder.mjs`, `agent_contract.mjs`) | Before 2.3.2, the manually invoked Python helpers inherited the full parent process environment by Node's default. Every helper launch now passes an explicit minimal environment (executable path, home, temporary directory and locale variables only) and runs Python with `-E -s -B`. No other parent variable, including any token or key a shell holds, reaches a helper. Tests check the allowlist and that every launch passes it. |
| `check_extension.py`, `package_extension.py`, `project_guard.py` | The guard no longer lists credential-store file or directory names. It rejects private paths by shape alone, before any read: hidden entries, suffix-less files other than license/readme-style documents, key/certificate/database file types, backend source and secret/credential/token-named data files. A selected root inside a hidden directory is refused unless a source-checkout marker sits between them (for example a worktree). Contents are never used to decide, and findings contain only paths and validation messages. |
| `studio/model.mjs` | The rejected example candidate is now "Broad access + remote code" and no longer describes a client secret. The module stays a pure transform with no environment, filesystem or network access. |
| `studio/styles.css` | Whitespace-only reformatting (one rule block per line) so the stylesheet is no longer a single minified line. |
| `.claude-plugin/plugin.json` | Identity, version and repository metadata only. No `mcpServers`, hooks, installer command, environment mapping or credential input. |

Regression fixtures use synthetic data. They verify that hidden credential-cache style files and `.env`/`.dev.vars` variants are never opened, protected roots are refused before manifest reads, findings do not contain protected contents, and packaging fails without creating an archive. Source evidence is not a directory clearance claim: the refreshed scan and Anthropic reviewer decide whether this hold is cleared.

The core workflow works in conversation without local execution. Optional helpers require available host tools and are manually invoked. Studio binds loopback; plans remain in browser memory by default, localStorage is opt-in, and explicit exports remain with the user. Requested research uses enabled host tools with scoped queries; host retention is independent. There is no plugin-hosted service retaining data. See [Privacy](../PRIVACY.md) and [Support](../SUPPORT.md).

Public branding follows the selected release artwork and its rights requirements. The plugin is an independent tool for adult developers. Structural checks, helper tests and archive integrity do not establish semantic model behavior across Claude surfaces or guarantee approval. Anthropic's observed scan and reviewer decision govern directory eligibility.

## Project intelligence in this update

The optional local `intelligence.py` helper reads only explicitly selected sanitized project JSON and referenced project evidence through contained path checks. It writes additive context, decision, feedback, outcome and job-spec records into the existing local project state, with explicit commands and no transcript harvesting. It generates local JSON/Markdown reports; it has no environment credential reader, network transport or host-scheduler client. Local job-state records do not activate schedules. The current Studio uses the same validated report interchange. No new credential configuration, MCP or automatic startup is introduced.
