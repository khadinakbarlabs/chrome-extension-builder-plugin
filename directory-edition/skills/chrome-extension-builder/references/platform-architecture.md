# Manifest V3 architecture guide

Read the dated [official source ledger](official-links.md) and refresh relevant pages when implementing. Version thresholds and framework commands can change.

## Browser contexts

| Context | Typical responsibility | Boundary |
| --- | --- | --- |
| Popup | Short action, compact status | May close at any time; persist drafts/jobs elsewhere |
| Side panel | Sustained work beside a tab | Choose global versus tab-specific state; programmatic opening needs a user interaction |
| Options/extension tab | Settings, account, long workflows | Privileged UI still validates all input |
| Content script | Scoped DOM reading/annotation | Page DOM/data are untrusted; isolated world does not make the DOM safe |
| Service worker | Events, messaging, grants, privileged fetch | Ephemeral; no DOM; persisted recovery required |
| Offscreen document | Justified DOM/media work | Bundled HTML; runtime is its supported extension API; manage creation/cleanup |
| DevTools/new-tab | Specialist developer/start-page journeys | Declare intentionally and test their own lifecycle |
| Native host | Native capabilities | Separate installation/distribution and security boundary |
| Backend/companion site | Protected keys, jobs, shared account data | Server authorizes every operation; client IDs are public |

Workers can terminate between operations. Register listeners synchronously at initialization, hydrate before handling stateful work, and save durable progress outside globals. Use alarms only where justified, bounded jobs, idempotent retries, and server jobs for long work. Worker inspection can mask shutdown bugs. Never use a hidden offscreen document simply to keep the worker alive.

## Storage and messaging

Use local for durable extension data, sync for small non-sensitive settings, session for ephemeral sensitive state, and IndexedDB for structured bulk/transactional data where justified. Session is memory-backed and clears on browser restart or extension disable/reload/update. Default local/sync exposure to content scripts needs review; restrict access to trusted contexts for sensitive data. Document quotas, concurrent writes, migration version, export/delete, logout, and account changes. None of these APIs is a secret vault.

Messages are JSON-compatible contracts: version, request ID, allowlisted operation, bounded payload, validated sender/frame/site, and structured result/error. Avoid arbitrary page-controlled fetch URLs. For broad Chrome compatibility, asynchronous responses can use sendResponse with a literal true return. Current official docs describe Promise listeners as rollout/version dependent; verify minimum support before relying on them. Never assume opening a port makes a worker persistent.

## Framework decision

Vanilla is a sensible minimal choice for a small few-surface tool. WXT provides entrypoints and generated manifests with configurable builds; verify runtime versus build-time entrypoint execution. In WXT, register listeners synchronously within the background definition's initialization, not at module scope that runs during manifest evaluation. Plasmo provides React-oriented extension conventions; inspect generated output rather than transplanting WXT paths. Preserve an existing healthy stack and pin installed dependencies. Verify current package/docs before installing a new framework.

Review the generated manifest and release CSP regardless of framework. Package executable dependencies; dev servers, inline handlers, eval, and fetched script/WASM execution are release hazards. Remote APIs returning data remain supported. Declare minimum Chrome based on actual APIs and feature-test optional support. Firefox/Edge portability requires separate API/manifest/runtime tests; Chrome-specific side panels are not a universal cross-browser contract.

## Permission plan

Connect each capability to the least powerful API and exact host access required. Prefer user-initiated activeTab and optional grants where practical. Denial/revocation must leave a usable recovery path. Persistent multi-site products may need broader patterns; explain the purpose and disclose access rather than inventing scope. Unsupported chrome:// pages and other restricted contexts should show a clear message, not silently fail.
