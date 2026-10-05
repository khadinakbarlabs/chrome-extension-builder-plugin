# Native installation and visibility

Use the complete native edition, not copied SKILL.md files without sibling references/helpers. Keep the same public plugin and skill IDs. Installation alone is not task selection or behavioral completion.

Codex: register a local marketplace with `.agents/plugins/marketplace.json`, pointing at the staged Codex edition; inspect `codex plugin marketplace add --help` and `codex plugin add --help` before using the current CLI. Add/reload through that supported flow, never by editing a cache. Confirm enabled version with `codex plugin list --json`, then verify actual components in a fresh session. The current chat may need reopening to receive a changed skill catalog.

Claude Code: register the owning local marketplace containing `.claude-plugin/marketplace.json`, install its namespaced plugin with `claude plugin install`, and confirm enabled version through `claude plugin list --json`. Use `/reload-plugins` or start a fresh session for component discovery. A `--plugin-dir` development launch is isolated exposure, not a default installation.

Cursor: copy the complete Cursor edition to `~/.cursor/plugins/local/chrome-extension-builder`; reload the window and inspect Customize. Symlinks to an external repository are skipped. An installed marketplace plugin with the same name takes precedence; local imports can also be disabled by administrative policy. Do not change that security setting or disable other editions silently.

For each host record source, staged version, enabled version, exposed component count, invocation mode, reload requirement and unavailable capabilities. Preserve unrelated configurations and existing edits. If a duplicate exists, report its precedence and use the established intended edition; do not bulk remove plugins.

Sources checked 2026-10-05: [Codex plugins](https://learn.chatgpt.com/docs/plugins), [Claude plugins](https://code.claude.com/docs/en/plugins), [Claude skills](https://code.claude.com/docs/en/skills), [Cursor local plugins](https://cursor.com/docs/plugins). Local CLI help supplies the actual supported installation arguments.
