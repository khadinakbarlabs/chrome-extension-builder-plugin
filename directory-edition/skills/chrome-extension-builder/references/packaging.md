# Packaging a build into a Store ZIP

Text-only replacement for the full edition's packager. Claude runs these steps with standard tools (`find`, `sort`, `zip`, `unzip`, `zipinfo`, `shasum`). Follow every step in order; if any step fails, stop and report it. Do not skip a step because an earlier run passed.

Variables used below: `ROOT` is the built directory containing `manifest.json`; `OUT` is the absolute path of the ZIP to create.

## 1. Validate first

Run the whole [manifest checklist](manifest-checklist.md) on ROOT. Any error means: do not package. Report the errors and stop. Carry its warnings into the final package report.

## 2. Guard the output path

| Rule | What to do |
| --- | --- |
| OUT outside ROOT | OUT must not be ROOT and must not be anywhere inside ROOT. Otherwise refuse |
| No silent overwrite | Check with `test -e OUT`. If it exists, do not overwrite and never append to it (`zip` would add to an existing archive and keep stale files). Choose a new file name, or delete the old ZIP only after the user explicitly agrees |
| Parent folder | Create it with `mkdir -p` if needed |

## 3. Refuse symlinks and non-regular files

- `find ROOT -type l` must print nothing. If it prints anything, stop: `zip` would otherwise follow the link and store the target's contents.
- `find ROOT ! -type f ! -type d` must print nothing.

## 4. Refuse sensitive content

Re-check the file list against the sensitive name table in [manifest-checklist.md](manifest-checklist.md) section 7 (hidden paths, `server`/`backend`/`secrets` folders, `.pem` `.key` `.p12` `.pfx` `.crt` `.cer` `.sqlite` `.db`, suffix-less files other than LICENSE/README-type names, server-named files, files named with secret/credential/token/service-account). Any match means stop. Excluding a file silently is not enough: the user must decide whether it belongs in the build.

## 5. Create the archive

Skip only these names when building the file list: `.git`, `node_modules`, `__pycache__`, `.DS_Store`, `.extension-builder`. Build the list in a stable sorted order and pass it to zip on stdin, from inside ROOT so `manifest.json` lands at the archive root:

- `cd ROOT && find . -type f ! -path '*/.git/*' ! -path '*/node_modules/*' ! -path '*/__pycache__/*' ! -path '*/.extension-builder/*' ! -name '.DS_Store' | sed 's|^\./||' | LC_ALL=C sort | zip -X -D -y -9 OUT -@`

Flags: `-X` drops extra file attributes, `-D` omits directory entries, `-y` stores any link as a link instead of following it (step 3 already refused links; this is a second guard), `-9` maximum compression, `-@` reads names from stdin.

**Reproducibility (optional).** `zip` stores each file's modification time, so two runs over the same files can produce different digests. When a reproducible digest matters, copy ROOT to a fresh folder under `$TMPDIR`, run `find STAGE -exec touch -t 198001010000 {} +` on the copy (never on the user's source), and package the copy with the same command. Say in the report whether this was done.

## 6. Verify the archive

| Check | Command | Pass condition |
| --- | --- | --- |
| Integrity (CRC) | `unzip -tq OUT` | Reports no errors |
| Manifest at root | `unzip -Z1 OUT` | Lists `manifest.json` with no folder prefix |
| Safe member names | `unzip -Z1 OUT` | No entry starts with `/`, contains a backslash, contains a `..` segment, or has an empty or `.` segment |
| No duplicates | `unzip -Z1 OUT \| sort \| uniq -d` | Prints nothing |
| No symlinks | `zipinfo OUT \| grep '^l'` | Prints nothing |
| Expected content | `unzip -l OUT` | Matches the reviewed file list; no source maps, test fixtures, keys, `.env` files or backend code unless deliberately shipped |

If any check fails, delete only the ZIP you just created (with the user's knowledge), fix the cause and start again from step 1.

## 7. Record the digest

Run `shasum -a 256 OUT` and record the digest in the release evidence (`docs/release.md` or the team.json report path).

## 8. Report

Return: output path, the file list, the SHA-256 digest, the checklist warnings, whether the reproducible-timestamp step was used, and these two explicit statements: **browser verified: no** (until the exact ZIP contents are loaded and tested in Chrome) and **Store published: no** (packaging is not submission).

Next, load the exact packaged files unpacked (extract the ZIP to a fresh folder) in Chrome and run the acceptance journeys before any upload.
