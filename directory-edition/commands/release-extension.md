---
description: Verify and package an exact Chrome extension build, prepare Store materials, and carry out the authorized distribution scope.
argument-hint: [extension project path and distribution target]
---

Handle release for: $ARGUMENTS

Read `chrome-extension-builder-release` and use the `release-manager` role with independent `security-reviewer` and `qa-engineer` evidence. Verify current Chrome Web Store requirements with primary documentation. Respect existing user authorization; obtain only consequential missing decisions after preparing concrete reviewable artifacts.

Confirm single purpose, minimal permissions and reasons, data disclosures, privacy/support details, local executable dependencies, real production endpoints, version/migrations, asset completeness and runtime tests on the exact release build. Apply every rule in `${CLAUDE_PLUGIN_ROOT}/skills/chrome-extension-builder/references/manifest-checklist.md`, then follow `${CLAUDE_PLUGIN_ROOT}/skills/chrome-extension-builder/references/packaging.md` step by step: output outside the source, no overwrite or append to an existing ZIP, symlink and sensitive-file refusal before zipping, `unzip -t` integrity, manifest.json at the archive root, member-name and duplicate checks, and the `shasum -a 256` digest. Stop on any failed step.

Prepare truthful listing text, screenshots/icons, reviewer instructions and release/rollback notes. Do not invent legal identity, privacy URLs, supported countries, test credentials or approval. Treat local package readiness, upload, review, publication and observed install as distinct states. Developer registration fees, uploads and submission are external actions that need the user's explicit go-ahead; never retry a submission automatically. If credentials/provider tooling are missing, retain the complete ready package and name the remaining gate; never imply a submission happened.

Return artifact links, observed checks, actual release state and next required action.
