# Official source ledger

Checked through live primary-source pages on **2026-10-02**. This records the verification date, not a promise that policy/API behavior will remain unchanged. Recheck relevant pages before selecting dependencies, deploying accounts/billing, declaring browser compatibility, or submitting a release. Search excerpts alone are insufficient for a release-critical detail.

- [Manifest V3](https://developer.chrome.com/docs/extensions/develop/migrate/what-is-mv3): service workers, packaged code, and major MV3 changes.
- [Declare permissions](https://developer.chrome.com/docs/extensions/develop/concepts/declare-permissions): permission fields, host patterns, warnings, and least privilege.
- [chrome.permissions](https://developer.chrome.com/docs/extensions/reference/api/permissions): requesting optional permissions at runtime.
- [Worker lifecycle](https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/lifecycle): ephemeral state, lifecycle, minimum-version considerations.
- [Messaging](https://developer.chrome.com/docs/extensions/develop/concepts/messaging): operation contracts, JSON serialization, response lifetime. Live docs describe Promise listeners as version/rollout dependent; callback/sendResponse with literal true remains the broad-compatibility asynchronous pattern.
- [Storage](https://developer.chrome.com/docs/extensions/reference/api/storage): lifetime, quotas, access levels. Session state is memory-backed and clears on browser restart and extension disable/reload/update; local/sync default exposure to content scripts needs review.
- [Content scripts](https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts): injection, isolated execution world, page interaction, frames.
- [Side panel](https://developer.chrome.com/docs/extensions/reference/api/sidePanel): surface configuration and user-interaction opening constraints.
- [Offscreen](https://developer.chrome.com/docs/extensions/reference/api/offscreen): justified DOM use, bundled HTML, supported extension API limitations, lifecycle.
- [Network requests](https://developer.chrome.com/docs/extensions/develop/concepts/network-requests): privileged extension requests versus content-script/page requests and unsafe proxy boundaries. The older cross-origin-network-requests path failed during verification; this is the working official page.
- [Identity](https://developer.chrome.com/docs/extensions/reference/api/identity): OAuth helpers, redirect generation, and interactive authorization behavior.
- [Remote hosted code](https://developer.chrome.com/docs/extensions/develop/migrate/remote-hosted-code): executable code packaging versus remote data; inspect dependencies for fetched code. The old develop/concepts path failed; use the migration guide.
- [Improve security](https://developer.chrome.com/docs/extensions/develop/migrate/improve-security): CSP, packaged logic, remote service architecture, special-context considerations.
- [Chrome Web Store policies](https://developer.chrome.com/docs/webstore/program-policies/policies): privacy, single purpose, disclosure, quality, and technical expectations.
- [Limited Use](https://developer.chrome.com/docs/webstore/program-policies/limited-use): limits on collection, use, transfer, and monetization of user data.
- [User-data FAQ](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq): disclosure and consent expectations, including local-only handling.
- [Publishing](https://developer.chrome.com/docs/webstore/publish): developer access, review and publication workflow; local validation is not approval.
- [Listing information](https://developer.chrome.com/docs/webstore/cws-dashboard-listing/): listing and reviewer preparation. Verify current dashboard fields rather than assuming older asset requirements remain authoritative.
- [Store images](https://developer.chrome.com/docs/webstore/images): screenshot/icon/promo guidance. Historical docs and dashboard pages may differ; confirm current dimensions/counts at release time.

## Host plugin and skill policy ledger

Verified primary pages on **2026-10-02** for the 2.1.0 skills-only architecture:

- [OpenAI plugin guidelines](https://developers.openai.com/plugins/plugin-guidelines): fundamentals/skills-only listing, host safeguards, scoped inputs, restricted data, privacy, commerce, and review. MCP-specific requirements apply only to MCP components, which this package does not declare.
- [Convert a Claude plugin to OpenAI](https://developers.openai.com/plugins/guides/submit-claude-plugin): command/agent behavior moves into skills, clean-environment verification, portable upload/portal conversion, and product-specific eligibility for core local access. This package's approval remains pending.
- [Claude plugin manifest](https://code.claude.com/docs/en/plugins-reference): native component paths and optional agents/commands; root bin has distribution limits. Native packages exclude bin, MCP, hooks, LSP, and bootstrap.
- [Skill authoring practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices): frontmatter limits, concise bodies, progressive disclosure, and tool-availability checks.
- [OpenAI usage policies](https://openai.com/policies/usage-policies/), [Anthropic Usage Policy](https://www.anthropic.com/legal/aup): host-specific permitted-use boundaries; reread current policy for sensitive/high-risk work.

See policy-boundaries.md for package controls. Local policy drafts and structural checks do not establish public listing URLs, identity/region eligibility, portal scan clearance, clean-host semantic behavior, or directory acceptance.

## Framework, test, and standards evidence

- [WXT entrypoints](https://wxt.dev/guide/essentials/entrypoints.html): generated manifest and entrypoint contracts. Background initialization is framework-defined and module imports can run during build; do not place runtime listeners where build evaluation invokes them.
- [Plasmo framework](https://docs.plasmo.com/framework): framework capabilities and current conventions. This supports a candidate choice, not a universal recommendation or proof of a selected package version.
- [Playwright extensions](https://playwright.dev/docs/chrome-extensions): persistent-context extension loading and bundled Chromium guidance; branded Chrome/Edge sideload flags differ. Verify actual browser channel/headless behavior.
- [OAuth security BCP, RFC 9700](https://www.rfc-editor.org/rfc/rfc9700.html): public-client protection, PKCE, redirect/issuer handling and modern threat considerations; pair with provider-specific implementation docs.
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/): applicable accessibility success criteria. A checklist alone does not prove conformance.

## Verification limits

No selected framework/package version, provider pricing, paid account, deployment, OAuth canary, or Chrome Web Store acceptance was established by this source ledger. Those need task-specific live evidence. Some official pages retain old publication timestamps while their content evolves; record both source timestamp and inspection date when the distinction matters. Use a task ledger with URL, checked date, claim, version/account context, observed/inferred status, and unresolved contradiction.

Use official documentation for current API details. Do not present local
heuristic checks as a substitute for Chrome validation or Web Store review.
