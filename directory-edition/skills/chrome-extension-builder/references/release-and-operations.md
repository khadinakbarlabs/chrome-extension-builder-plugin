# Release and continuing operations

Refresh current [store publishing, policies, and image requirements](official-links.md) before each public release. Dashboard requirements/fees and platform behavior are time-sensitive. Do not hard-code a registration fee or assume older screenshot guidance wins over the current dashboard.

## Reproducible local artifact

Pin dependencies and record source identity, build command/environment, generated directory, manifest/version/minimum Chrome, and ZIP digest. Build production output with packaged executable dependencies. Check references and CSP, inspect client bundles/source maps for keys/dev hosts, run meaningful behavior/security/browser checks, and package only extension output with manifest.json at the root. Exclude caches, env files, secrets, and unrelated server/source artifacts. Load the same generated directory used for the package.

CI should install locked dependencies, run applicable unit/API/browser tests, build, inspect the manifest/artifact, preserve redacted evidence, and produce a versioned ZIP/checksum. Protect credentials and avoid automatic production deployment/store upload unless explicitly within scope. Package verification is a separate result from all browser cases passing.

## Store assets and reviewer access

Prepare name/short/full descriptions tied to the single purpose, real screenshots, icons/promo assets, localized copy where supported, support/contact links, privacy policy, permission explanations, actual data-use/retention declarations, and release notes. Verify dimensions/counts/dashboard fields live. Screenshots must represent shipped behavior, not unsupported UI claims. Avoid keyword stuffing, impersonation, unverifiable rankings, or misleading AI/data claims.

Reviewer instructions explain install/account setup, exact primary journey, permission grants, paid/account-only behavior, and troubleshooting. Provide an appropriate test account through the platform's protected review channel where required, never commit or expose its credentials in public docs. Disclosures must include actual third-party/cloud/analytics processing and local data handling according to current requirements.

## External actions

Prepare local source/ZIP/listing/reviewer/privacy/CI results before approval for an action lacking authorization. Account signup, fees, data access, production credentials, billing configuration, deployment, and submission use existing user authorization if applicable. No blanket keyword gate. When authorized and tools support it, perform the action and read back exact deployment or item/version/status. A queued submission is not accepted, a staged API is not production, and a local script is not hosted monitoring.

## Rollout and maintenance

Record backend/API version, migrations and backups, entitlement compatibility, health canary, store/version status, rollout channel, incident owner, support links, monitoring, and rollback/recovery. Backend rollback and extension update propagation differ; store changes may require review. Test migrations from the prior release and preserve old-client compatibility during rollout.

Monitor only within configured consent/disclosure. Redact page content/URLs/tokens, collect minimal error/version/context metrics, bound retention, and maintain disconnect/delete. Recheck Chrome/provider/framework changes with primary sources and run targeted regressions. Real scheduled monitoring requires verified scheduler/credentials/first run and notification intent. Document unresolved gates and continuation; never claim activation from configuration alone.
