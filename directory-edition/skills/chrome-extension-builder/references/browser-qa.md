# Actual extension QA

Read current [Playwright extension documentation](https://playwright.dev/docs/chrome-extensions) before implementing the harness. Use an isolated persistent browser context with the built extension directory. Current docs recommend bundled Chromium for sideload automation because branded Chrome/Edge removed relevant command-line flags. Record actual channel/version and verify headless support. Do not reuse the user's personal browser profile for automated test state.

Discover the extension ID from its loaded worker/runtime. Open its actual popup/options/extension URL when useful, and interact with a synthetic page to exercise content scripts and worker messaging. This is different from opening the same HTML through a web server. Mocking Chrome APIs helps unit tests but cannot prove platform integration.

## Matrix

| Case | Required evidence |
| --- | --- |
| Fresh install and first journey | Clear purpose; no unexplained permission/auth prompt |
| Popup close/reopen | Draft/progress survives as designed; no duplicate work |
| Side panel/tab switch | Intended tab/global state; supported user-triggered opening |
| Worker idle/termination/restart | Recovery, persisted state, listeners, safe retries |
| Navigation/SPA/frames | Scope, cleanup, duplicate prevention, correct target |
| Grant/deny/revoke | Accessible recovery; no operation beyond current permission |
| Restricted URLs/incognito/files | Accurate unsupported state; explicit settings if supported |
| Options/storage/update | Persistence, quotas, version migration, concurrency |
| Offline/slow/429/5xx | Timeout/cancel/retry; truthful status; no unlimited spend |
| Account state | Signed out/expired/revoked/switch; isolation and deletion |
| API negatives | Unauthenticated/cross-user/replay/malformed denied |
| Accessibility | Keyboard/focus/labels/status; zoom/contrast/reduced motion |
| Host UI collisions | Scoped CSS; readable theme; dismissal and focus restoration |
| Release directory/ZIP | Exact production output loaded, no development executable sources |

Apply only shipped contexts; mark others not applicable with a reason. Keep worker DevTools closed during idle tests because inspection changes lifecycle. Use safe test accounts and synthetic fixtures. Test support across minimum/current Chrome and declared alternate browsers when compatibility is claimed.

## Report

Record source commit or source-tree identity, artifact hash/build command, date, browser/version/channel, OS, fixture, case and expected result, observed pass/fail/not-run, redacted screenshot/trace, defects, and reruns. Include manual branded-Chrome checks where toolbar UI, keyboard shortcuts, side-panel behavior, account flow, or install/update warnings need them. Automated Chromium proof is valuable but does not imply all branded-Chrome interactions were tested.

Run only meaningful coverage appropriate to risk. New features/bugs get failing behavioral tests or explicit reproductions before repair; cosmetic reversible edits usually need visual/interaction checks, not mirrored unit tests. Never claim browser QA from a static checker or page-only preview. If tools cannot run the extension, finish local verification and deliver exact unrun cases/load steps.
