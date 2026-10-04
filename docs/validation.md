# Release verification

Version 2.3.0 uses a shared skills-only corpus and isolated native wrappers. The release builder verifies extracted archive membership, byte integrity, version consistency, resource resolution, native metadata isolation and credential exclusions. Optional local helpers and Studio have behavioral tests. Plugin-maintenance tooling remains outside native installable archives.

The new project intelligence helper preserves legacy lifecycle records, keeps feedback local, separates recorded human sessions from scheduled runs/retries, and exports evidence-linked reports. Job definitions do not activate schedules. Studio imports validate project identity and structured fields; context changes invalidate affected evidence.

Exact current test results and artifact hashes accompany the release matrix and release verification artifact. Structural validation, local tests and a forward scenario evaluation are separate from clean-host installation, semantic behavior across Claude/Codex/Cursor, observed scheduled runs and external approval. Any unrun checks stay unrun. Directory findings are never cleared by declaring a pass here.
