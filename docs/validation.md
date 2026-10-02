# Version 2.2.1 validation

Verified locally on 2026-10-02. This report separates structural/tool evidence from semantic host behavior, public pages, and platform review. No installation, external publication, deployed backend, or blanket policy approval is asserted.

## Current source and tool checks

- 29 Python behavioral tests passed, including MCP/hook rejection, native package isolation, portable role resolution, credential-file exclusion, path/symlink boundaries, reproducible ZIP integrity, session evidence, worker message validation and loopback Studio controls.
- Five JavaScript model tests passed for import boundaries, inert unsafe text, command quoting, declared readiness, bounded candidate safety and architecture feedback.
- Source validation passed: consistent version 2.2.1, 19 skills and host metadata files, resolving links, shared policy references and 12 portable roles. All skill frontmatter and native agent frontmatter parsed as YAML; native preloads use plugin-qualified skill names.
- Portable manifest passed the official Agent Plugins 1.0.0 JSON schema. Plugin Builder canonical validation passed without warnings. Actual `claude plugin validate .claude-plugin/plugin.json` passed.
- Native archives exclude root bin/npm runtime, MCP/app/LSP/configuration/hook/bootstrap components. OpenAI/portable archives omit Claude-native root agents/commands; those intents and roles are available through skills/references.

- All 19 native skill identifiers, branded display names, default-prompt references, icon paths and PNG limits passed. The portable interface and OpenAI compatibility overlay match exactly; native Claude skill preloads resolve after renaming. See [metadata catalog and icon](metadata.md).

## Earlier functional baseline retained

The following browser checks were run on the 2.0.0 functional baseline earlier on the same date. They remain baseline evidence, not a fresh 2.2.1 clean-host or model-policy evaluation. The 2.2.1 update renames skills, synchronizes metadata, and changes icon assets. It retains the 2.1.0 helper/registry relocation and packaging hardening; current model tests cover the copied-command path.

The studio passed at 1440, 820, 390, and 320 pixels without horizontal overflow or JavaScript errors. Verified form editing and live preview, phase/checklist interaction, opt-in persistence and reload, theme changes, session/Markdown export, valid/invalid imports, unsafe text rendered inertly, candidate application, three-round bounds, and reset.

An unpacked generated MV3 extension passed actual browser interactions: popup note save, reload persistence, shared options storage, cross-surface dark appearance, side-panel document save, search, delete, and no page exceptions. A synthetic page-dispatched save shortcut was rejected; a real keyboard shortcut saved the selected text through the content-script/worker boundary.

## Package integrity and scope of proof

The release packager allowlists archive members, rejects private/configuration components and symlinks, fixes ZIP metadata, hashes outputs, and extracts every native and single-directory Plugin Creator archive for byte comparison. The accompanying release-matrix.json identifies generated archives and hashes. Separately verify helpers against extracted packages before installation; integrity does not prove host discovery, policy enforcement, approval, or publication.

The baseline side-panel HTML was tested by direct navigation; browser toolbar opening and chrome://extensions management were not exercised. No live cloud API, account/OAuth canary, paid service, native messaging host, Store submission or accepted listing was tested. Studio checklist status and illustrative candidate scores are declarations, not independent verification.

Ten functionality/policy scenarios are specified in policy-evaluations.md; model/clean-host semantic execution is UNRUN. Actual discovery/activation in supported native hosts remains pending. Claude-native text adapters pass local schema checks; removing root bin resolves a documented installer incompatibility, but is not observed claude.ai/Cowork installation proof.

Chrome-logo brand-use permission, four public HTTPS pages/contact, developer/account verification, country selection, directory eligibility and portal scans/review remain pending as recorded in policy-audit.md. The optional Cloudflare site draft is separate from native plugin archives and no hosted MCP/plugin backend is introduced.
