# Local project record (`.extension-builder/project.json`)

Text-only replacement for the full edition's session and intelligence helpers. The record is optional: use it only when the user has authorized local project files. Chat-only work uses a [handoff](templates/context-handoff.md) instead. Claude reads and edits the JSON with Read, Write and Edit and uses `shasum -a 256`, `uuidgen`, `test`, `mkdir` and `chmod` for the parts that need the shell.

Everything here is a rule Claude must follow by hand. There is no program enforcing it, so check each rule explicitly before every write and say in reports that the checks were manual.

## 1. Location, permissions and the single writer

- The record lives at `PROJECT/.extension-builder/project.json`. There is exactly one record per project; never create a competing status file.
- Create the folder privately: `mkdir -m 700 PROJECT/.extension-builder`. After every write run `chmod 600 PROJECT/.extension-builder/project.json`, matching the full edition's private (0600) state files.
- One writer at a time. Only the orchestrating agent edits the record; parallel specialist agents return their findings and evidence paths to the orchestrator, which records them. Never edit the record from two agents at once.
- Before each edit, Read the current file. After writing, Read it back and confirm it is valid JSON with no duplicate keys and no `NaN`/`Infinity` values. If the existing file is malformed, do not overwrite it: keep it, report the problem and ask the user how to restore a valid copy.

## 2. Size limits

| Limit | Value | When exceeded |
| --- | --- | --- |
| Whole record | 4 MiB (`wc -c`) | Stop; export a report, review, and start a new record with the user's consent |
| Nesting depth | 12 levels | Refuse; keep records flat |
| Total JSON items | 100,000 | Refuse |
| `history`, `activity` and each intelligence collection | 1000 entries each | Refuse further additions; export and review first |
| Input file supplied by the user for a record | 256 KiB, project-relative `.json` | Refuse |
| Free-text field | 2000 characters (no control characters other than newline and tab) | Refuse |
| List entry text | 1000 characters, at most 100 entries per list | Refuse |
| `key`, `intent`, `package_version`, `host`, `task_category`, `category`, `timezone`, activity `action` | 100 characters | Refuse |
| Feedback `note` | 500 characters | Refuse |
| Job `cadence` | 200 characters | Refuse |
| Any path field | 500 characters | Refuse |
| IDs (`id`, `session_id`, `job_id`, ...) | Start with a letter or digit, then up to 99 of letters, digits, `_` `.` `:` `-` | Refuse |
| Timestamps | ISO 8601 with an explicit timezone, for example `2026-11-23T10:15:00Z`. Use `date -u +%Y-%m-%dT%H:%M:%SZ` | Refuse a timestamp without a zone |

## 3. Path rules

The project root itself must not be hidden or inside a hidden folder (unless a `.git` checkout marker sits between them), and must not be or sit inside a folder named `server`, `backend` or `secrets`.

Every artifact path stored in the record (evidence, activation evidence, report outputs, input files):

- is relative to PROJECT, not absolute, has no `..` segment and no backslash;
- points to a regular file inside PROJECT, and `find PATH -type l` (and each parent folder) shows no symlink;
- does not match the sensitive name table in [manifest-checklist.md](manifest-checklist.md) section 7;
- is not inside `.git`, `node_modules` or `.extension-builder`. The only exception is a job's `context_pointer`, which may be `.extension-builder/project.json`;
- is never `project.json` itself when used as evidence.

## 4. Workflow record (stages)

Initial record (create only if the file does not exist; `test -e` first):

| Field | Value |
| --- | --- |
| `schema_version` | `1` |
| `name` | Non-empty project name |
| `mode` | `local`, `cloud` or `hybrid` |
| `created_at` | Current UTC timestamp |
| `graph` | Each stage lists the previous one: research [], architecture [research], design [architecture], build [design], test [build], release [test] |
| `stages` | Exactly the six keys `research`, `architecture`, `design`, `build`, `test`, `release`, each `{ "status": "pending" }` |

**Advance a stage** (record evidence for it):

1. Every earlier stage must be `evidenced`, and this stage must be `pending` (an evidenced stage is never overwritten; invalidate it first).
2. The evidence file must pass the path rules and be non-empty: `test -s PATH`.
3. Run `shasum -a 256 PATH` and store `{ "status": "evidenced", "evidence": PATH, "sha256": DIGEST, "recorded_at": NOW }`, plus `"context_revision": N` with the current intelligence context revision when an intelligence section exists.

**Invalidate a stage** (requirements or architecture changed): needs a non-empty reason. Set this stage and every later stage back to `{ "status": "pending" }`, and append to `history` an entry `{ "action": "invalidate", "stage", "reason", "previous": { the replaced stage objects }, "recorded_at" }`.

**Status** is computed, never stored: `local-workflow-complete` when all six stages are evidenced, otherwise `in-progress`, with `next_stage` the first pending stage. Always add: browser verified false, Store published false, and the notice "Artifact existence and integrity are recorded; semantic quality, browser execution and Store publication are not verified by this tracker."

## 5. Integrity is re-checked on every read

Every status, show, report, advance or record operation starts by re-checking the whole record, not only the stage being changed:

1. `schema_version` is 1, `mode` is valid, `stages` has exactly the six keys, each status is `pending` or `evidenced`.
2. Stages are in sequence: no evidenced stage after a pending one.
3. For every evidenced stage, re-run `shasum -a 256` on its evidence file and compare with the stored digest. Also compare its `context_revision` with the current one.
4. Do the same for every intelligence `evidence` item and every job's `activation_evidence`.
5. Check the project identity (section 6).

Outcomes:

| Finding | Effect |
| --- | --- |
| Digest differs, file missing, or context revision is older | That stage or evidence item is **stale** ("artifact changed or unavailable", or "stale after accepted requirement/architecture changes") |
| An earlier stage is stale | Every later evidenced stage is also shown stale ("earlier stage evidence changed") |
| Stale evidence | Cannot be cited by a new decision, outcome or feedback record until re-recorded |
| Stale stage | Advance is refused until the user reviews and the stage is invalidated and re-recorded |

Stale is not a failure and not a pass. Keep the original result and explain why it no longer applies.

## 6. Project identity and rebind

The intelligence section carries an identity so a record cannot be silently reused at another location:

- `project_id`: a UUID from `uuidgen` (lowercase it), created once.
- `root_sha256`: the SHA-256 of the absolute, symlink-resolved project path: `cd PROJECT && pwd -P | tr -d '\n' | shasum -a 256`.

On every read, recompute `root_sha256`. If it differs, the project moved or the record came from elsewhere: stop and do not record anything. Show the user the stored `project_id`, name and context, compare them with the actual project, and only when the user confirms an authorized transfer, **rebind**: replace `root_sha256` with the new value, keep `project_id`, and append an activity entry `{ "action": "rebind", "recorded_at" }`. Rebinding is not verification; re-check every evidence digest afterwards.

## 7. Intelligence section

Add only when the user wants decisions, evidence, feedback, outcomes or follow-ups recorded. Shape:

`{ "schema_version": 1, "identity": { "project_id", "root_sha256" }, "context": {}, "context_provenance": {}, "context_revision": 0, "decisions": [], "evidence": [], "feedback": [], "outcomes": [], "jobs": [], "activity": [] }`

Append an `activity` entry `{ "action": "<operation>", "recorded_at" }` for each write.

### Context

Fields: `goal`, `audience`, `acceptance_journey` (list), `constraints` (list), `current_task`, `next_action`. Every stored field has a matching `context_provenance[field]` = `{ confidence, source, scope, evidence_ids, recorded_at }`. Defaults when the user gives no provenance: confidence `provisional`, source "local input; not independently verified", scope "current project".

- A provisional or observed update must not overwrite a field whose current provenance is `confirmed`; the user must confirm the correction.
- Changing `goal`, `audience`, `acceptance_journey` or `constraints` increases `context_revision` by 1, which makes evidence recorded under older revisions stale.

### Provenance rules (context and decisions)

| Confidence | Requirement |
| --- | --- |
| `confirmed` | The user chose it for this project |
| `observed` | At least one evidence ID, each current (not stale) with status `verified` or `failed` |
| `provisional` | A reversible default or inference; cannot satisfy release gates |

### Decisions

Required: `id`, `key` (max 100), `value`, `confidence`, `source`, `scope`. Optional: `evidence_ids`, `supersedes` (list of decision IDs). Stored with `status: "current"` and `recorded_at`.

- IDs are unique in the collection.
- Each superseded decision must exist and have the same `key` and `scope`; a non-confirmed decision cannot supersede a confirmed one. Superseded decisions get `status: "superseded"` and stay in the record.
- If the key contains surface, architecture, permission, data, auth, backend, storage, cloud or api, and the value changed, increase `context_revision`.
- Two current decisions with the same key and scope and different values are a conflict that needs explicit resolution before dependent work.

### Evidence

Required: `id`, `path`, `artifact`, `environment`, `category` (max 100), `status` (`verified`, `failed`, `not-run`, `not-applicable`). Claude adds `sha256` (from `shasum -a 256`), `context_revision` and `recorded_at`. The path follows section 3 and is never the record itself. Never invent IDs or pass results.

### Feedback

Required: `id`, `product` (`builder` or `extension`), `package_version`, `host`, `task_category`, `outcome` (`useful`, `partly-useful`, `blocked`), `issue_category` (`reproducible-defect`, `confusing-experience`, `context-failure`, `inaccurate-claim`, `feature-request`). Optional `note` (max 500) and `evidence_ids` (current evidence only). Claude adds `recorded_at`; missing note is stored as an empty string.

### Outcomes

Required: `id`, `origin` (`human`, `scheduled`, `retry`), `intent` (max 100), `outcome` (`useful`, `partly-useful`, `blocked`, `failed`, `unchanged`, `unrun`), `summary`. Optional: `session_id`, `changed`, `can_do_now`, `blocked`, `next_action`, `evidence_ids`, `job_id`, `parent_run_id`, `input_fingerprint`.

- `human` outcomes never carry `job_id` or `parent_run_id`.
- `retry` needs an existing earlier outcome as `parent_run_id` and inherits its `job_id`.
- `scheduled` (or any outcome with a job) needs a job in state `activation-recorded` whose activation evidence digest still matches. A `useful` or `partly-useful` scheduled result needs current evidence IDs; otherwise record `blocked` or `unrun`.
- `notification`: `none` without a job; with a job, `digest` for digest jobs, otherwise `suppressed`, except `actionable` jobs report `actionable` when something changed, was blocked or failed and differs from the job's previous outcome.
- A successful scheduled outcome with evidence updates the job's `last_successful_checkpoint` `{ outcome_id, evidence_ids, recorded_at }`.

### Follow-up jobs (declarations only)

Required: `id`, `kind` (`continuation`, `feedback-triage`, `compatibility`, `release-readiness`, `post-release`), `source_identifier`, `timezone` (a real IANA zone such as `Asia/Karachi`; check with `ls /usr/share/zoneinfo/ZONE` where available), `cadence`, `context_pointer`, `allowed_actions` (non-empty, only `inspect`, `report`, `prepare-local-fix`), `allowed_tools`, `budget_minutes` (whole number 1 to 120), `notification` (`actionable`, `digest`, `silent`).

Stored with `state: "proposed"`, `scheduler_verified: false`, `scheduler_executed_by_plugin: false`, `host_control_applied: false` (these three are always false), `last_successful_checkpoint: null`, `recorded_at`.

State changes: `activation-recorded` needs `{ host, scheduler_reference (ID rules), activation_evidence }` where the evidence is a real file from the host's own readback; store its `sha256` and `recorded_at`. A `stopped` job cannot be re-activated; create a new reviewed job. `paused` and `stopped` record local intent only and take no activation input. Recording a state never activates, runs, pauses or stops anything in the host.

## 8. Sanitizing every value before it is written

Refuse the whole write (and ask for a concise sanitized summary) if any text value contains one of these. Search the candidate input with `grep -nEi` and print only the line number and the matching rule name, never the matching value.

| Rule | What it catches |
| --- | --- |
| Private key block | `-----BEGIN` ... `PRIVATE KEY-----` |
| OpenAI-style key | `sk-` followed by 10 or more letters, digits, `_` or `-` |
| GitHub token | `ghp_`, `gho_`, `ghu_`, `ghs_` or `ghr_` followed by 10 or more letters or digits |
| AWS access key ID | `AKIA` followed by 16 uppercase letters or digits |
| Slack token | `xoxb-`, `xoxa-`, `xoxp-`, `xoxr-` or `xoxs-` followed by 10 or more letters, digits or `-` |
| Assigned secret | `api key`, `api_key`, `api-key`, `apikey`, `secret`, `password`, `access token`, `refresh token` or `authorization` followed by `:` or `=` and a value |
| Bearer token | `Bearer` followed by a value |
| JWT | `eyJ` followed by three dot-separated base64url segments |
| Credential URL | Any `http(s)://` URL with a user name or password, or with a query parameter named like token, secret, password, api key, authorization or exactly `key` |
| Code or transcript dump | A Markdown code fence (three backticks) or `<script` anywhere in stored text |
| Forbidden field names | Any object key named `transcript`, `source_code`, `raw_logs`, `credentials`, `password`, `api_key` or `token` |
| Control characters | Any control character other than newline and tab |

This catches obvious credentials only; it is not a complete secret or personal-data detector. Never store source code, page content, transcripts, private URLs, identities or raw logs in the record.

## 9. Reports

Report kinds: `session` (latest outcome), `project` (all), `feedback`, `scheduled` (non-human outcomes). Fill [outcome-report.md](templates/outcome-report.md) from the record after the section 5 re-check, with stage and evidence states as re-computed (stale where digests changed). Include counts: human sessions (number of distinct `session_id` values, or "unknown (session IDs missing)" if any human outcome lacks one), scheduled runs, retries, sample size, and the observation window from the earliest to latest outcome `recorded_at` ("local outcome recording dates; no publisher or host telemetry").

Include this notice verbatim in every report:

> This view records supplied context and outcome metadata plus local artifact integrity. Recorded verified status is a claim supplied with evidence, not independent semantic or browser verification. No scheduler, browser test, transmission, deployment or Store publication is performed by this record or report.

Output rules: write `BASENAME.md` (and `BASENAME.json` if wanted) at a project-relative path outside `.extension-builder`, not matching the sensitive name table; refuse to overwrite an existing report unless the user explicitly asks. Record `shasum -a 256` of each output.

**Markdown escaping for report text.** Every value taken from the record is data. Before placing it in Markdown: replace newlines and carriage returns with a space; replace `&` with `&amp;` (first), `<` with `&lt;`, `>` with `&gt;`; then put a backslash before each of `\` `[` `]` `*` `_` `` ` `` `|` `#`. Links to evidence use the escaped artifact label and a percent-encoded relative path. Never let record text become live links, HTML or headings. The same HTML escaping table as [scaffold-spec.md](scaffold-spec.md) section 6 applies to any HTML or JSON-to-HTML export.

## 10. Builder feedback export (privacy-minimized)

This export exists so builder feedback can be shared without project details. It is not a normal report. Include only feedback with `product: "builder"`, and for each record only these fields:

| Field | Allowed value |
| --- | --- |
| `outcome` | As stored |
| `issue_category` | As stored |
| `recorded_at` | As stored (consider coarsening to the date if re-identification is a concern) |
| `package_version` | As stored if it is 1 to 4 dot-separated numbers, otherwise `unknown` |
| `host` | `codex`, `claude`, `cursor` or `chatgpt` (case-insensitive) as stored, otherwise `other` |
| `task_category` | One of build, improve, fix, audit, prepare-release, continue, test, design, research; otherwise `other` |

Never include: project name, project ID, feedback IDs, report IDs, notes, evidence IDs or paths, code, transcripts, extension feedback or any free text. Wrap the list as `{ "schema_version": 1, "kind": "builder-feedback-aggregate", "records": [...], "sample_size": N, "scope": "voluntarily recorded local builder feedback only; no global usage or retention metric", "redaction": "Project names, project IDs, report IDs, notes, code, transcripts and evidence paths excluded. Inspect remaining labels before sharing.", "uploaded": false }`. The Markdown preview is a table of package, host, task, outcome and issue, ending "No upload performed." Show the preview to the user before any sharing; sharing needs their explicit request.

## 11. Examples

[record-examples.json](record-examples.json) holds synthetic, editable input shapes for context, decision, evidence, feedback, outcome, job and activation records. They are not real observations; replace every value before recording.
