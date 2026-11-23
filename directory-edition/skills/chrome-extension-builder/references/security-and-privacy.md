# Security and privacy release gates

Use current [Chrome policies and platform docs](official-links.md). This checklist supplements threat modeling, source review, and runtime tests; it cannot guarantee store acceptance or absence of vulnerabilities.

## Threat boundaries to examine

- Host DOM/page scripts → content script: hostile text, markup, selectors, URLs, spoofed messages, frame origins, navigation races.
- Content script/external site → worker: confused-deputy fetch, arbitrary command routing, excessive payloads, permission bypass, forged operation type.
- UI/worker → backend: missing authentication, cross-account/tenant access, CSRF with cookies, rate-limit evasion, unbounded costs, SSRF and injection.
- Backend → vendors/database: leaked keys, overbroad identities/scopes, webhook spoof/replay, data retention and unauthorized sharing.
- Dependency/build → packaged artifact: remote code, unsafe eval, client env secrets, compromised dependency, dev hosts/source maps, unnecessary telemetry.

## Hard checks

For each permission and host, record capability, rationale, data, user initiation, denial/revocation, and alternative. Examine web_accessible_resources and externally_connectable; use narrow matches and no secret/privileged material in accessible assets. Review content-script main-world bridges separately. Verify version-gated API behavior against minimum Chrome.

Validate message schemas and sender identity/context with purpose-specific checks. An allowed page origin does not authorize every operation. Do not trust arbitrary page-chosen URLs, commands, paths, HTML, or selectors. Minimize transmitted fields and bound payload/response work. Render untrusted text with safe sinks; apply a vetted sanitizer only for intentionally supported rich content.

Check CSP on the generated extension, package executable JS/WASM, and examine library code that fetches then executes remote resources. Remote JSON/API results can be data; a configuration interpreter that implements arbitrary remote logic is not a safe workaround. Sandbox/DevTools exceptions require dedicated architecture and current policy review, not automatic checker suppression.

Verify server-side ownership/authorization on every operation; CORS/client IDs/extension IDs are not secrets or identity proof. Cover OAuth callback binding/expiry, safe token storage, CSRF where relevant, webhook signatures, redacted errors/logs, rate limits, and secrets excluded from ZIP/client bundles. Negative tests should demonstrate denial, not only happy-path access.

## Data inventory and disclosure

Record each data category: page URL/text, selected content, settings, account identifiers, billing metadata, device/diagnostic events, analytics. For each: source, purpose, processing location, recipients, persistence, retention, encryption transport, consent, deletion/export, and disconnect. Local handling may still need store disclosure; consult the current dashboard/user-data FAQ. The shipped behavior, privacy policy, permission rationale, store declarations, and reviewer account must agree. Do not promise legal compliance from a template.

## Release decision

Critical/high security issues, leaked secrets, covert collection, remote executable payloads, deceptive UI, unauthorized data transfers, or missing ownership checks block release. A broad-permission warning can be justified by the product contract after explicit review; document residual risk. Each finding includes severity, evidence, exact location, remediation, and targeted retest. Independent review adds evidence only when actually performed.
