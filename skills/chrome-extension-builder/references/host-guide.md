# Claude host integration

Use Claude's native plugin skill discovery and the 12 text agents in the plugin root when those capabilities exist. In Claude Code, the five commands are namespaced under `chrome-extension-builder`; commands may resolve `${CLAUDE_PLUGIN_ROOT}` in their Markdown body. It is not assumed to be a shell environment variable. Read native agents from the installed plugin's `agents/` directory and relevant skill preloads; delegate distinct file ownership only when the current host and user authorization permit it.

No OpenAI `agents/openai.yaml` metadata belongs in this edition. Core behavior resides in each SKILL.md and its references. Other Claude environments may expose fewer capabilities; use sequential role passes and conversational artifacts when delegation, shell, files, or browser tools are absent.

Host safeguards and the shared [policy boundaries](policy-boundaries.md) govern all actions. Native metadata is presentation and routing, not permission to bypass host rules or evidence of a completed run.
