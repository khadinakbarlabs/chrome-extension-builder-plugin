# Chrome Extension Builder metadata

Release 2.2.6, updated 2026-10-02. Plugin identity stays `chrome-extension-builder`; all nineteen skill identifiers now share this native namespace. Earlier generic skill identifiers have been renamed: reload an updated package and use the current names below. Shared policy boundaries and workflow behavior are retained.

## Skill catalog

| Native display name | Skill identifier |
| --- | --- |
| Chrome Extension Builder | [chrome-extension-builder](../skills/chrome-extension-builder/SKILL.md) |
| Chrome Extension Builder: Architecture | [chrome-extension-builder-architecture](../skills/chrome-extension-builder-architecture/SKILL.md) |
| Chrome Extension Builder: Audit | [chrome-extension-builder-audit](../skills/chrome-extension-builder-audit/SKILL.md) |
| Chrome Extension Builder: Backend | [chrome-extension-builder-backend](../skills/chrome-extension-builder-backend/SKILL.md) |
| Chrome Extension Builder: Build | [chrome-extension-builder-build](../skills/chrome-extension-builder-build/SKILL.md) |
| Chrome Extension Builder: Debugging | [chrome-extension-builder-debugging](../skills/chrome-extension-builder-debugging/SKILL.md) |
| Chrome Extension Builder: Evolution | [chrome-extension-builder-evolution](../skills/chrome-extension-builder-evolution/SKILL.md) |
| Chrome Extension Builder: Frontend | [chrome-extension-builder-frontend](../skills/chrome-extension-builder-frontend/SKILL.md) |
| Chrome Extension Builder: Improve | [chrome-extension-builder-improve](../skills/chrome-extension-builder-improve/SKILL.md) |
| Chrome Extension Builder: Integrations | [chrome-extension-builder-integrations](../skills/chrome-extension-builder-integrations/SKILL.md) |
| Chrome Extension Builder: Maintenance | [chrome-extension-builder-maintenance](../skills/chrome-extension-builder-maintenance/SKILL.md) |
| Chrome Extension Builder: Performance | [chrome-extension-builder-performance](../skills/chrome-extension-builder-performance/SKILL.md) |
| Chrome Extension Builder: Prepare Release | [chrome-extension-builder-prepare-release](../skills/chrome-extension-builder-prepare-release/SKILL.md) |
| Chrome Extension Builder: Release | [chrome-extension-builder-release](../skills/chrome-extension-builder-release/SKILL.md) |
| Chrome Extension Builder: Research | [chrome-extension-builder-research](../skills/chrome-extension-builder-research/SKILL.md) |
| Chrome Extension Builder: Security | [chrome-extension-builder-security](../skills/chrome-extension-builder-security/SKILL.md) |
| Chrome Extension Builder: Studio | [chrome-extension-builder-studio](../skills/chrome-extension-builder-studio/SKILL.md) |
| Chrome Extension Builder: Testing | [chrome-extension-builder-testing](../skills/chrome-extension-builder-testing/SKILL.md) |
| Chrome Extension Builder: UX Design | [chrome-extension-builder-ux-design](../skills/chrome-extension-builder-ux-design/SKILL.md) |

## Shared presentation and native routing

### OpenAI listing copy

The public name remains **Chrome Extension Builder**. The subtitle is **Build Chrome extensions**. The description explains concrete tasks, chat outputs and the optional local-execution limitation; it avoids promotional claims and internal host/agent packaging terminology. Starter prompts cover planning, popup/side-panel design and permissions/release review.

The package meets the documented bounds: display name and subtitle each at most 30 characters, description at most 4000 characters, and three unique starter prompts each at most 128 characters. Package validation does not determine the result of OpenAI's remote metadata check. The message “We couldn’t complete the check of your plugin’s name and description” reports an incomplete check without identifying a specific policy violation; preserve and report the actual new-version result rather than declaring the warning fixed from local validation alone.

All native editions use the same identity, release, README, policies, skill catalog and specialist role contracts. Their manifests point to the shared repository. The common icon is packaged in each edition; public brand artwork requires the necessary rights.

Claude retains native text agents and commands. Codex/OpenAI uses its native manifest and skill presentation YAML. Cursor uses only its native manifest and discovery guide. Host metadata remains isolated even though the underlying skills and documentation match.

## Public compatibility artwork

The public logo uses the independent browser-and-extension mark with the literal label “for Chrome”. Google Chrome is a trademark of Google LLC; this reference describes browser compatibility and does not imply affiliation or endorsement. The selected Chrome-emblem artwork remains a separate local build and is excluded from default public archives.
