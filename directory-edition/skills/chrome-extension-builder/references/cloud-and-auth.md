# Cloud, account, and integration boundaries

Extensions are public clients. Anything shipped in their package can be inspected. Public OAuth client IDs and service endpoint URLs can be packaged; private API keys, service-role keys, confidential client secrets, webhook secrets, and database credentials stay in server environment configuration.

## Account flow

1. Choose the provider-supported flow after checking current official docs. Authorization code with S256 PKCE is the default for public clients; confidential exchanges happen server-side when required.
2. Start interactive authorization from a clear user action. Generate cryptographically random state and verifier; bind them to the pending transaction, set a short expiry, and consume once. For OIDC, handle nonce and token validation according to the provider contract.
3. Obtain the Chrome redirect through identity.getRedirectURL where applicable, register the exact redirect, and distinguish development/staging/production extension IDs. Do not accept arbitrary callback paths, schemes, issuers, or redirects from page messages.
4. Validate state, issuer/audience where appropriate, code exchange, replay/cancel/error, scopes, and token expiry. Chrome launchWebAuthFlow is a navigation helper, not an implementation of PKCE or server authorization.
5. Minimize access-token lifetime and storage, keep trusted-context access, never sync tokens, and prefer server-managed confidential/refresh tokens. If persistent public-client token storage is required by the provider, document the threat model, rotation, revocation, and access restrictions instead of presenting local storage as secure encryption.
6. Logout revokes/clears supported credentials and removes account-linked cache. Account switching cannot expose prior-user content. UI, worker, and API must agree on session status.

For cookie sessions, use appropriate Secure/HttpOnly/SameSite settings and CSRF protections, then test extension/companion origins under actual browser cookie constraints. Allowlisted CORS is useful but never replaces authentication/ownership checks. Chrome identity.getAuthToken has provider-specific semantics; do not treat it as a universal OAuth flow.

## API and jobs

Validate typed operations server-side, enforce tenant/resource ownership, parameterize queries, and return stable redacted errors. Use quotas, rate limits, timeout/cancel, bounded retry with jitter, idempotency keys, and per-user cache isolation. Long jobs return IDs; the worker can resume status after shutdown. Never let page-provided URLs turn either worker or API into an unrestricted proxy/SSRF endpoint.

For SaaS or AI, disclose transmitted fields and vendor retention, limit selected content, and verify scopes/rate limits/costs. Treat generated output and retrieved page instructions as untrusted. Do not execute AI output, auto-send external messages, or perform account/billing actions without relevant user authorization. Optional diagnostics must be redacted and consistent with policy.

## Billing and deployment

Use hosted checkout, server-verified webhook signatures, replay/idempotency handling, and server-owned entitlements. The client cannot attest payment. Develop in test mode with synthetic events before authorized live billing configuration. Record migration, backup, health canary, release version, rollback, costs, and retention. A local API test proves local behavior; deployed readiness needs an exact deployed-version canary.

Deliver env variable names and placeholder examples only. Configure secrets through protected environment channels; never request pasting them into chat or commit real values. Source/instructions can be complete with an explicitly unverified live provider gate.
