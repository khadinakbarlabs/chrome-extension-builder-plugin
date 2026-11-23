# Starter scaffold specification

The full edition ships a generator for a working local-notes starter. This edition describes the same starter as a specification; Claude writes the user's project files with Write, following this spec and [role-frontend-engineer.md](role-frontend-engineer.md). The files Claude writes are the user's own project code. This document is a specification, not a template to copy verbatim, so adapt structure, naming and styling to the user's product.

A scaffold is a baseline. Changing the name and purpose does not implement a different product. Implement the user's actual acceptance journey before calling the work complete.

## 1. Inputs and validation

| Input | Rule (refuse and ask if violated) |
| --- | --- |
| Name | Non-empty, at most 75 characters, contains at least one Latin letter or digit. The folder slug is the lowercased name with every run of other characters replaced by `-`, trimmed of `-`, at most 50 characters |
| Purpose | Non-empty, at most 132 characters (Chrome's description limit). Becomes `manifest.description` |
| Output folder | If it exists it must be a directory. Never overwrite an existing file: list each target path with `ls` first and stop if any exists, unless the user explicitly asks to replace those generated files only |
| Surfaces | Any of popup, side panel, options page, service worker, content script. With no surface chosen, default to popup |
| Content-script matches | Required when a content script is chosen and not allowed without one. Each must be an exact `http` or `https` host plus a path, for example `https://example.com/*`. No wildcard hosts, no `<all_urls>`, no `?` in the host. Lowercase scheme and host |
| API origin (optional) | `https` only, a host, no user name or password, no path other than `/`, no query, no fragment, no `*`, valid port if given. Strip a trailing `/` |

## 2. File tree by choice

| File | When | Purpose |
| --- | --- | --- |
| `manifest.json` | Always | See section 3 |
| `styles.css` | Always | Shared tokens and layout for all extension pages |
| `app.js` | Always | Shared page logic, loaded as an ES module (`<script type="module" src="app.js">`) |
| `config.js` | Always | Exports one constant, the API origin or `null` |
| `popup.html` | Popup chosen, or no side panel chosen | Popup surface |
| `side-panel.html` | Side panel chosen | Side panel surface |
| `options.html` | Options chosen | Options page, opened in a tab |
| `service-worker.js` | Service worker, side panel or content script chosen | Background logic |
| `content-script.js`, `content-script.css` | Content script chosen | Page-side selection capture and a status notice |
| `README.md` | Always | See section 8 |
| `icons/icon-16.png`, `icon-48.png`, `icon-128.png` | Only if the user supplies an image (section 7) | Toolbar and store icons |

## 3. Manifest

- `manifest_version` 3, `version` `0.1.0`, `name`, `description`, `permissions: ["storage"]`, `action: { default_title: NAME }`.
- Popup: `action.default_popup: "popup.html"`.
- Side panel: add permission `sidePanel`, `side_panel.default_path: "side-panel.html"` and `minimum_chrome_version: "116"`.
- Options: `options_ui: { page: "options.html", open_in_tab: true }`.
- Worker: `background: { service_worker: "service-worker.js", type: "module" }`.
- Content script: one entry with the de-duplicated exact `matches`, `js: ["content-script.js"]`, `css: ["content-script.css"]`, `run_at: "document_idle"`.
- API origin: `host_permissions: ["ORIGIN/*"]` and nothing broader.
- `icons` and `action.default_icon`: include only when the icon files actually exist. Chrome loads a manifest without icons (it shows a default letter icon), but a manifest that points to missing icon files fails to load.

Run the [manifest checklist](manifest-checklist.md) on the result.

## 4. Behavior of the notes starter

| Area | Required behavior |
| --- | --- |
| Storage | `chrome.storage.local` keys `notes` (array) and `preferences` (`{ theme }`). Never rely on a live global in the worker |
| Load | Disable Save and show "Loading your notes…" until storage loads; on failure show a recoverable error |
| Validation of stored data | Keep only notes with string `id`, string `text` of at most 2000 characters and a parsable `createdAt` date; cap at 500. Theme must be `system`, `light` or `dark`, otherwise `system` |
| Save | Trim text; refuse empty or over 2000 characters with a focused error; refuse when 500 notes exist; read the latest list before writing; new note first with `crypto.randomUUID()` and an ISO date; keep the typed text on failure |
| Delete | Per-note button with an accessible label naming the note's time; re-read storage before writing; move focus to search afterwards |
| Search | Case-insensitive filter as the user types; distinct empty states for "no notes" and "no matches" |
| Appearance | System/light/dark select stored in preferences; applied by setting or removing a `data-theme` attribute on the root element |
| Sync between surfaces | Listen to `chrome.storage.onChanged` (area `local`) and re-render |
| Character count | Live "N / 2,000" counter linked by `aria-describedby` |
| Options link | When an options page exists, a button calls `chrome.runtime.openOptionsPage()` with an error message on failure |
| Concurrency note | Several open surfaces can race on read-then-write; say so in the README and suggest serializing writes through the worker for production |

**Service worker.** On install, if the manifest has a side panel, call `chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })` and log a warning on failure. For messages, treat page data as untrusted: accept only `type: "save-selection"` from this extension's own content script (`sender.id` equals `chrome.runtime.id` and `sender.tab` is set), whose `sender.url` exactly matches a declared content-script match (same scheme, same host, path matching the pattern's path with `*` as a wildcard). Text must be a non-empty string of at most 2000 characters. Respond `{ ok: false, error }` with `invalid-selection`, `note-limit` or `storage-unavailable` as appropriate, and return `true` from the listener only for the asynchronous success path.

**Content script.** Act only on a trusted Alt+Shift+S key press that is not a repeat and not inside an editable field (`input`, `textarea`, `select`, contenteditable). Send the selected text (1 to 2000 characters) to the worker, then show a short `role="status"` notice for about four seconds. The notice's CSS uses `!important` declarations and a single specific class name so page styles cannot break it, and uses `pointer-events: none`.

**Optional API probe.** Only when an API origin was given: a user-initiated "check API" button sends `GET ORIGIN/health` with `credentials: "omit"`, `redirect: "error"` and an 8 second timeout. It sends no notes and no credentials. State clearly that it is a health probe only, not sign-in or sync.

## 5. Page structure, accessibility and visual states

- One `<main>` with a header (brand mark, title in `<h1>`, an "Appearance" toggle button with `aria-controls` and `aria-expanded`), a short intro, a `<form>` with a labelled `<textarea maxlength="2000">`, the counter and a primary Save button.
- A status line with `role="status"` and `aria-live="polite"`; error tone styled with a danger color, not color alone (the message text says what failed).
- A labelled search input, a list with `aria-label="Saved notes"`, and an empty state.
- A settings section (hidden by default except on the options page) holding the appearance select and a plain privacy note: notes stay in this browser profile, removing the extension clears them, no analytics.
- Visible `:focus-visible` outline, buttons at least about 42 px tall, popup width about 380 px, text that wraps long words, reduced-motion respected (only animate when `prefers-reduced-motion: no-preference`).
- Color tokens on `:root` for background, card, text, muted text, line, accent, on-accent, tint and danger; a dark set under `:root[data-theme="dark"]` and under `@media (prefers-color-scheme: dark)` for `:root:not([data-theme="light"])`. Check contrast of text and accent in both themes.
- No inline `<script>` bodies and no `on...` attributes (Manifest V3 CSP blocks them). No remote scripts, fonts or styles.

## 6. HTML escaping rules for anything Claude writes into HTML

The name and purpose come from the user and must be treated as text, not markup.

| Character | Write as |
| --- | --- |
| `&` | `&amp;` (escape this first) |
| `<` | `&lt;` |
| `>` | `&gt;` |
| `"` | `&quot;` |
| `'` | `&#x27;` |

Apply this to every user-supplied value placed in element text or in an attribute value, and always quote attribute values. At runtime, page scripts must insert user and page data with `textContent` (never `innerHTML`, `outerHTML`, `insertAdjacentHTML` or `document.write`).

## 7. Icons (optional)

Claude cannot create binary PNG files with Write. Icons are therefore optional:

- Default: leave out `icons` and `action.default_icon`. Chrome shows a generic icon; the extension still loads.
- If the user wants icons, ask for a square source image (PNG or JPEG, ideally 512x512 or larger). Create the three sizes with a standard image tool that is already installed, writing into `icons/`:
  - macOS: `sips -z 16 16 SOURCE --out icons/icon-16.png`, and the same with 48 and 128.
  - ImageMagick: `magick SOURCE -resize 16x16 icons/icon-16.png` (or `convert` on older installs), and the same with 48 and 128.
- Confirm the files exist (`ls -l icons/`), then add `icons` (and optionally `action.default_icon`) for sizes 16, 48 and 128 to the manifest. Store listings also need a 128x128 icon; see [release-and-operations.md](release-and-operations.md).

Do not install image tools without the user's consent.

## 8. Starter README

Include: name and purpose; what the starter implements (local notes, search, delete, appearance, storage states) and that it is an example to adapt, not the finished product; how to load it unpacked at `chrome://extensions` with Developer mode and reload after edits; what to test in real Chrome (storage persistence, keyboard use, errors, worker restart); the content-script shortcut and its exact hosts, or "No page access is requested"; the API probe limits, or "No analytics or network adapter is included"; the concurrency note; and a warning never to put secrets, certificates, `.env` files or backend source in the extension folder. Point to [manifest-checklist.md](manifest-checklist.md) and [packaging.md](packaging.md) for checking and packaging.

## 9. Report

List the files written, the surfaces and permissions chosen, whether icons were created, and state **browser verified: no** and **Store published: no** until those are actually observed.
