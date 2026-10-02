#!/usr/bin/env python3
"""Validate and create a reproducible root-layout ZIP with a SHA-256 digest."""
from __future__ import annotations
import argparse
import hashlib
import json
import os
import tempfile
import zipfile
from pathlib import Path
from check_extension import validate_extension, SKIP_PARTS
from tool_paths import safe_path


def regular_files(root: Path) -> list[Path]:
    root = safe_path(root)
    files = []
    for current, dirnames, filenames in os.walk(root, followlinks=False):
        directory = Path(current)
        for name in list(dirnames):
            if (directory / name).is_symlink(): raise ValueError(f'symlink is not allowed: {name}')
            if name in SKIP_PARTS: dirnames.remove(name)
        for name in filenames:
            path = directory / name
            if path.is_symlink(): raise ValueError(f'symlink is not allowed: {path}')
            if name in SKIP_PARTS: continue
            if not path.is_file(): raise ValueError(f'not a regular file: {path}')
            files.append(path)
    return sorted(files, key=lambda p: p.relative_to(root).as_posix())


def verify_archive(path: Path) -> list[str]:
    errors = []
    try:
        with zipfile.ZipFile(path) as archive:
            seen = set()
            for info in archive.infolist():
                name = info.filename
                normalized = name.rstrip('/')
                parts = normalized.split('/')
                if not normalized or '\\' in name or name.startswith('/') or '..' in parts or any(not p or p == '.' for p in parts):
                    errors.append(f'unsafe ZIP member: {name}')
                if normalized in seen: errors.append(f'duplicate ZIP member: {name}')
                seen.add(normalized)
                if (info.external_attr >> 16) & 0o170000 == 0o120000: errors.append(f'ZIP symlink is not allowed: {name}')
            if 'manifest.json' not in seen: errors.append('ZIP does not contain manifest.json at its root')
            if archive.testzip() is not None: errors.append('ZIP checksum verification failed')
    except (OSError, zipfile.BadZipFile) as exc: errors.append(f'invalid ZIP: {exc}')
    return sorted(set(errors))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('extension', type=Path)
    parser.add_argument('--output', required=True, type=Path)
    parser.add_argument('--force', action='store_true')
    args = parser.parse_args()
    try:
        root, output = safe_path(args.extension), safe_path(args.output)
        result = validate_extension(root)
        if result['errors']: raise ValueError('refusing to package invalid extension: ' + '; '.join(result['errors']))
        if output == root or root in output.parents: raise ValueError('output ZIP must be outside extension directory')
        if output.exists() and (not args.force or not output.is_file()): raise ValueError(f'refusing to overwrite output: {output}')
        output.parent.mkdir(parents=True, exist_ok=True)
        files = regular_files(root)
        descriptor, name = tempfile.mkstemp(prefix='.extension-package-', suffix='.tmp', dir=output.parent)
        os.close(descriptor)
        temp = Path(name)
        try:
            with zipfile.ZipFile(temp, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
                for path in files:
                    info = zipfile.ZipInfo(path.relative_to(root).as_posix(), date_time=(1980, 1, 1, 0, 0, 0))
                    info.compress_type = zipfile.ZIP_DEFLATED
                    info.create_system = 3
                    info.external_attr = 0o100644 << 16
                    archive.writestr(info, path.read_bytes(), compress_type=zipfile.ZIP_DEFLATED, compresslevel=9)
            errors = verify_archive(temp)
            if errors: raise ValueError('; '.join(errors))
            safe_path(args.output)
            if args.force: os.replace(temp, output)
            else:
                # Atomic no-clobber publication. Existing files cannot race this check.
                os.link(temp, output)
                temp.unlink()
        finally:
            if temp.exists(): temp.unlink()
        print(json.dumps({'output': str(output), 'files': [p.relative_to(root).as_posix() for p in files], 'sha256': hashlib.sha256(output.read_bytes()).hexdigest(), 'warnings': result['warnings'], 'browser_verified': False, 'store_published': False}, indent=2))
    except (OSError, ValueError) as exc: raise SystemExit(str(exc))


if __name__ == '__main__': main()
