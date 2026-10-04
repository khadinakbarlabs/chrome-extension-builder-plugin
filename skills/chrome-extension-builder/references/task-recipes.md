# Practical extension recipes

Select from the actual job. Recipes are reference architectures, not generated-product claims. Use synthetic fixtures, explicit supported scope, bundled MV3 code, validated messages, accessible states, and current official API facts. The local notes scaffold only implements its documented starter.

| Recipe | Context/data boundary | Useful slice | Acceptance/failure checks |
| --- | --- | --- | --- |
| Selected-text helper | User gesture, context menu/activeTab; explicit selection only | Select synthetic text → local action → visible result/copy | Empty/large selection, restricted page, injection failure, keyboard, unsupported site, scoped grants |
| SaaS companion | Popup/side panel + generated API, provider auth/tenant ownership server-side | Synthetic signed-out/connected states, one authorized API action | PKCE/state/cancel/expiry, offline/rate-limit, account switch/disconnect/delete, grant/revoke, secret-free bundle |
| Offline workspace | Popup/options/tab, local storage, worker only if needed | Create/edit/search/delete synthetic note, visible save state | Close/reopen, storage errors, migrations/restart, empty/long data, focus/keyboard, export intent |
| Supported-site annotator | Content adapter on chosen sites, isolated UI, local annotations | One synthetic supported page, add/remove annotation | DOM mutation/navigation/frames, denial/revoke, selector drift, overlap/a11y, unsupported notice |

Confirm purpose/surfaces/data → minimum permissions → message/API/UX contracts → useful journey → exact runtime evidence → security/privacy/performance review → release assets. Optional cloud is a product choice, not a plugin account connection. Never turn a recipe into covert surveillance, restricted-data extraction, or access-control bypass.

Compare actual project candidates only when alternatives matter; freeze constraints/rubric first. See [architecture](platform-architecture.md), [auth](cloud-and-auth.md), [QA](browser-qa.md), [evaluation](candidate-evaluation.md).
