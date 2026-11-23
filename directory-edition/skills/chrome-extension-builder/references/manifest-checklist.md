# Static manifest and build checklist

This is the text-only replacement for the full edition's deterministic checker. Claude applies every rule below by reading files (Read, Glob, Grep) and ordinary shell listings (`find`, `ls`). Static checks are heuristics: they never prove Chrome behavior, Store compliance, auth, privacy or performance. Loading the build unpacked at `chrome://extensions` remains the authoritative manifest check.

Report results in three lists: **errors** (must fix before packaging), **warnings** (needs documented justification), **info** (always include the two info lines at the end). Any error means the build is not ready to package. Never mark a rule "pass" if it was not actually checked; say "not checked" and why.

## 0. Choose and guard the root

Use the directory that contains the built `manifest.json` (framework output such as `dist/`, not the source tree, when a build step exists).

| Rule | Fail condition (error) |
| --- | --- |
| Root exists | The path is missing or is not a directory |
| Root is not private | Any path component is hidden (starts with `.`, except `.extension-builder`), or is named `server`, `backend` or `secrets` (case-insensitive). A hidden parent is acceptable only when a `.git` checkout marker sits between it and the root (for example a git worktree) |
| No symlinks anywhere | `find ROOT -type l` prints anything. Stop and report every listed path; do not follow them |
| manifest.json | Missing, not a regular file, not valid JSON, or not a JSON object |

While walking the build, skip these names entirely: `.git`, `node_modules`, `__pycache__`, `.DS_Store`, `.extension-builder`.

## 1. Required top-level fields

| Field | Rule (error if violated) |
| --- | --- |
| `manifest_version` | Must be the integer `3` (not the string "3") |
| `name`, `version`, `description` | Each a non-empty string |
| `version` | 1 to 4 dot-separated integers; each 0 to 65535 with at most 5 digits; no leading zeros (`01` is invalid, `0` is valid); at least one component non-zero (`0.0` is invalid) |
| `action`, `background`, `options_ui`, `side_panel`, `icons` | If present, each must be a JSON object |
| `background.service_worker` | If `background` exists, must be a non-empty string |
| `background.type` | If present, exactly `classic` or `module` |
| `options_ui.page` | If `options_ui` exists, must be a non-empty string |
| `options_ui.open_in_tab` | If present, a boolean (`true`/`false`, not a string) |
| `side_panel.default_path` | If `side_panel` exists, must be a non-empty string |
| `action.default_popup` | If the key is present, a non-empty string (an `action` without a popup is fine) |
| `options_page`, `devtools_page` | If present, a non-empty string |

## 2. Icons

| Rule | Fail condition (error) |
| --- | --- |
| `icons` and `action.default_icon` object form | Every key must be a positive whole number of at most 5 digits (`"16"`, `"48"`, `"128"`), every value a non-empty path |
| `action.default_icon` | Must be either a path string or a size-to-path object |
| Icons are optional | A manifest with no `icons` key is valid. Do not invent icon paths; if icons are declared, every listed file must exist (rule 5) |

## 3. Permissions and host patterns

| Field | Rule |
| --- | --- |
| `permissions`, `optional_permissions`, `host_permissions`, `optional_host_permissions` | Each, if present, an array of non-empty strings (error otherwise) |
| Every entry in `host_permissions` and `optional_host_permissions` | Must be a valid Chrome match pattern (error otherwise) |
| Broad hosts | Warning if any permission list contains `<all_urls>`, `*://*/*`, `http://*/*`, `https://*/*` or `file:///*`: "broad hosts need documented necessity; consider activeTab or exact optional hosts" |

**Valid Chrome match pattern** (apply by reading each value):

1. `<all_urls>` on its own is valid.
2. Otherwise the shape is `SCHEME://HOST/PATH`. SCHEME is one of `http`, `https`, `ftp`, `file` or `*`. PATH must start with `/` and contain no whitespace.
3. For `file`, HOST must be empty (`file:///...`).
4. For every other scheme, HOST is required and is either `*` alone, or an optional leading `*.` followed by dot-separated labels made of letters, digits and hyphens. A `*` anywhere else in the host is invalid (`foo*.com`, `*foo.com`).
5. HOST may end with `:PORT` where PORT is `*` or 1 to 5 digits.

## 4. content_scripts and web_accessible_resources

Each section, if present, must be an array of objects (error otherwise).

| Section | Rule (error if violated) |
| --- | --- |
| content_scripts | `matches` is a non-empty array of non-empty strings, each a valid match pattern |
| content_scripts | Has a non-empty `js` or `css` array (arrays of non-empty strings) |
| content_scripts `run_at` | If present: `document_start`, `document_end` or `document_idle` |
| content_scripts `world` | If present: `ISOLATED` or `MAIN` |
| content_scripts `all_frames`, `match_about_blank`, `match_origin_as_fallback` | If present: boolean |
| web_accessible_resources | `resources` is a non-empty array of non-empty strings |
| web_accessible_resources `matches` | If present, array of valid match patterns |
| web_accessible_resources `extension_ids` | If present, an array where each entry is `*` or exactly 32 characters from the letters `a` to `p` |
| web_accessible_resources | Needs `matches` or `extension_ids` (at least one non-empty) |
| web_accessible_resources `use_dynamic_url` | If present: boolean |

## 5. Every referenced file exists and is shippable

Collect every path the manifest references:

- `action.default_popup`, `background.service_worker`, `side_panel.default_path`, `options_ui.page`, `options_page`, `devtools_page`
- every value in `icons` and in `action.default_icon` (string or object)
- every entry of `content_scripts[].js`, `content_scripts[].css` and `web_accessible_resources[].resources`

For each reference:

| Rule | Fail condition (error) |
| --- | --- |
| Safe path | Absolute path, contains a `..` segment, or contains a backslash |
| Not sensitive | The path matches the sensitive-name table in section 7 |
| Exists | Non-glob path: Glob/`ls` shows no regular file at ROOT/path |
| Glob matches | A path with `*`: Glob from ROOT finds no files ("referenced resource pattern has no files") |

## 6. File-by-file walk

List files with `find ROOT -type f` (after confirming no symlinks) and skip the names in section 0. For each file:

| Check | How | Result |
| --- | --- | --- |
| Not a regular file | `find ROOT ! -type f ! -type d` prints it | error |
| Sensitive directory | Any directory component hidden or named `server`, `backend`, `secrets` | error "sensitive or backend directory cannot ship in extension" |
| Sensitive file | Name matches section 7 | error "sensitive or backend artifact cannot ship in extension" |

Then inspect contents only for `.js`, `.mjs`, `.html`, `.css` and `.json` files.

### Remote or dynamic code in `.js` / `.mjs` (error per file)

Search each script with Grep (case-insensitive). Any hit is an error "potential remote or dynamic code pattern found in FILE". Report file and line, then judge false positives explicitly rather than silently dropping them.

| Pattern family | What to search for |
| --- | --- |
| Dynamic import or importScripts of a remote URL | `import(` or `importScripts(` whose first argument is a quoted string starting with `http://`, `https://` or `//` |
| Static import/export from a remote URL | `import ... from "https://..."`, `export ... from "//..."`, or a bare `import "https://..."` |
| eval / Function constructor | `eval(`, `Function(`, `new Function(` |
| String timers | `setTimeout(` or `setInterval(` whose first argument is a quoted string (single, double or backtick) |

Useful one-line searches (run from ROOT):

- `grep -rnEi '\b(eval|Function)\s*\(' --include='*.js' --include='*.mjs' .`
- `` grep -rnEi '\b(setTimeout|setInterval)\s*\(\s*["'"'"'`]' --include='*.js' --include='*.mjs' . ``
- `` grep -rnEi '\b(import|importScripts)\s*\(\s*["'"'"'`](https?:)?//' --include='*.js' --include='*.mjs' . ``
- `grep -rnEi '\b(import|export)\s+([^;]*\bfrom\s*)?["'"'"'](https?:)?//' --include='*.js' --include='*.mjs' .`

### HTML files (`.html`)

Read each HTML file.

| Check | Result |
| --- | --- |
| A `<script>` element without `src` that has non-whitespace content, unless its `type` is `application/json` or `application/ld+json` | error "inline executable script or event handler" |
| Any attribute whose name starts with `on` (`onclick`, `onload`, ...) on any element | same error |
| `<script src>`, `<link href>` or `<img src>` with a scheme or `//host` (remote) on a `<script>` | error "remote executable asset" |
| Same, but on `<link>` or `<img>` | warning "external display asset requires privacy/CSP review" |
| Local `src`/`href` asset (resolved relative to the HTML file's own directory, URL-decoded) that does not exist under ROOT | error "HTML asset is missing" |
| Local asset path that escapes ROOT (`..` past the root) | error "unsafe HTML asset" |

## 7. Sensitive name table

A path is sensitive (never ships) when any row matches. The decision uses the name only; never open the file to decide.

| Rule | Matches |
| --- | --- |
| Hidden or backend directory | Any component starting with `.` (except `.extension-builder`, which is skipped), or named `server`, `backend`, `secrets` |
| Key or database suffix | `.pem`, `.key`, `.p12`, `.pfx`, `.crt`, `.cer`, `.sqlite`, `.db` |
| Suffix-less file | Any file with no extension, unless its lowercased name is `license`, `licence`, `notice`, `readme`, `copying`, `authors` or `changelog` |
| Server-named file | Stem is `server` or `backend`, or ends with `-server` or `_server` |
| Secret-named file | Stem, split on `-`, `_`, `.` and spaces, contains a word `secret`, `secrets`, `credential`, `credentials`, `token` or `tokens`, or contains `service-account` / `service_account`, unless the file is a display asset |

Display-asset suffixes (exempt from the secret-name row only): `.css`, `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, `.svg`, `.ico`, `.avif`, `.woff`, `.woff2`, `.ttf`, `.otf`.

A quick listing for review: `find ROOT -type f \( -iname '*.pem' -o -iname '*.key' -o -iname '*.p12' -o -iname '*.pfx' -o -iname '*.crt' -o -iname '*.cer' -o -iname '*.sqlite' -o -iname '*.db' -o -iname '*secret*' -o -iname '*credential*' -o -iname '*token*' -o -iname '*service?account*' -o -path '*/.*' \)`. Then check suffix-less and server-named files by reading the `find ROOT -type f` list.

## 8. Info lines (always)

- `Static heuristics only; browser behavior, auth, privacy and Store review require separate evidence.`
- `checked ROOT` (the exact directory you inspected)

## Reporting

Give file and line for each finding, the rule it broke and the smallest fix. If the build is large, say which files were inspected in full and which were sampled; never imply full coverage you did not perform. Then recommend loading the exact build unpacked in Chrome and reading any errors Chrome shows on `chrome://extensions`, which catches manifest problems this checklist can miss.
