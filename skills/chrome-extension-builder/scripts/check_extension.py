#!/usr/bin/env python3
"""Inspect a built Manifest V3 directory. Heuristics do not certify Store compliance."""
from __future__ import annotations
import argparse
import json
import os
import re
from html.parser import HTMLParser
from pathlib import Path
from typing import Any
from urllib.parse import unquote, urlsplit
from tool_paths import safe_path, relative_file

BROAD = {'<all_urls>', '*://*/*', 'http://*/*', 'https://*/*', 'file:///*'}
SKIP_PARTS = {'.git', 'node_modules', '__pycache__', '.DS_Store', '.extension-builder'}
SENSITIVE_SUFFIXES = {'.pem', '.key', '.p12', '.pfx', '.crt', '.cer', '.sqlite', '.db'}
SENSITIVE_NAMES = {'.npmrc', '.netrc', '.git-credentials', '.pypirc', 'id_rsa', 'id_ed25519', 'id_ecdsa', 'id_dsa', 'credentials.json', 'service-account.json', 'server.py', 'server.js', 'server.ts', 'backend.py', 'backend.js', 'backend.ts'}
REMOTE_PATTERNS = [
    re.compile(r'\b(?:import|importScripts)\s*\(\s*[\"\x27`](?:https?:)?//', re.I),
    re.compile(r'\b(?:import|export)\s+(?:[^;]*?\bfrom\s*)?[\"\x27](?:https?:)?//', re.I),
    re.compile(r'\b(?:eval|(?:new\s+)?Function)\s*\(', re.I),
    re.compile(r'\b(?:setTimeout|setInterval)\s*\(\s*[\"\x27`]', re.I),
]



def valid_match(value: str) -> bool:
    """Validate common Chrome host-match syntax; browser loading remains authoritative."""
    if value == '<all_urls>': return True
    match = re.fullmatch(r'(https?|ftp|file|\*)://([^/]*)(/[^\s]*)', value)
    if not match: return False
    scheme, host, _ = match.groups()
    if scheme == 'file': return not host
    if not host: return False
    return bool(re.fullmatch(r'(?:\*|(?:\*\.)?(?:[a-zA-Z0-9-]+\.)*[a-zA-Z0-9-]+)(?::(?:\*|[0-9]{1,5}))?', host))


def sensitive_file(path: Path) -> bool:
    name = path.name.lower()
    return name == '.env' or name.startswith('.env.') or name in SENSITIVE_NAMES or path.suffix.lower() in SENSITIVE_SUFFIXES or any(p.lower() in {'server', 'backend', 'secrets', '.ssh'} for p in path.parts)


def referenced_files(manifest: dict[str, Any]) -> list[str]:
    refs = []
    for section, key in (('action', 'default_popup'), ('background', 'service_worker'), ('side_panel', 'default_path'), ('options_ui', 'page')):
        obj = manifest.get(section)
        if isinstance(obj, dict) and isinstance(obj.get(key), str):
            refs.append(obj[key])
    for key in ('options_page', 'devtools_page'):
        if isinstance(manifest.get(key), str):
            refs.append(manifest[key])
    for icons in (manifest.get('icons'), manifest.get('action', {}).get('default_icon') if isinstance(manifest.get('action'), dict) else None):
        if isinstance(icons, dict):
            refs.extend(v for v in icons.values() if isinstance(v, str))
        elif isinstance(icons, str):
            refs.append(icons)
    for section, keys in (('content_scripts', ('js', 'css')), ('web_accessible_resources', ('resources',))):
        entries = manifest.get(section)
        if isinstance(entries, list):
            for entry in entries:
                if isinstance(entry, dict):
                    for key in keys:
                        values = entry.get(key)
                        if isinstance(values, list):
                            refs.extend(v for v in values if isinstance(v, str))
    return refs


class AssetParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.assets: list[tuple[str, bool]] = []
        self.inline = False
        self.in_script = False
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        key = {'script': 'src', 'link': 'href', 'img': 'src'}.get(tag)
        if key and attrs.get(key):
            self.assets.append((attrs[key], tag == 'script'))
        if tag == 'script':
            self.in_script = not attrs.get('src') and attrs.get('type', '').lower() not in {'application/json', 'application/ld+json'}
        if any(k.lower().startswith('on') for k in attrs):
            self.inline = True
    def handle_data(self, data):
        if self.in_script and data.strip():
            self.inline = True
    def handle_endtag(self, tag):
        if tag == 'script':
            self.in_script = False


def validate_extension(root: Path) -> dict[str, Any]:
    result = {'errors': [], 'warnings': [], 'info': []}
    def error(message): result['errors'].append(message)
    try:
        root = safe_path(root)
    except ValueError as exc:
        error(str(exc)); return result
    if not root.is_dir():
        error(f'extension directory does not exist: {root}'); return result
    try:
        manifest_path = relative_file(root, 'manifest.json')
        if not manifest_path.is_file(): raise ValueError('manifest.json must be a regular file')
        manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
    except (OSError, ValueError) as exc:
        error(f'manifest.json is missing or invalid: {exc}'); return result
    if not isinstance(manifest, dict):
        error('manifest.json must contain an object'); return result
    if type(manifest.get('manifest_version')) is not int or manifest['manifest_version'] != 3:
        error('manifest_version must be 3')
    for key in ('name', 'version', 'description'):
        if not isinstance(manifest.get(key), str) or not manifest[key].strip():
            error(f'{key} must be a non-empty string')
    version = manifest.get('version')
    if isinstance(version, str):
        parts = version.split('.')
        if not re.fullmatch(r'(?:0|[1-9]\d*)(?:\.(?:0|[1-9]\d*)){0,3}', version) or any(len(p) > 5 or int(p) > 65535 for p in parts if p.isdigit()) or not any(p.isdigit() and int(p) > 0 for p in parts):
            error('version must have 1–4 numeric components, each 0–65535 without leading zeros, and at least one nonzero component')
    for key in ('action', 'background', 'options_ui', 'side_panel', 'icons'):
        if key in manifest and not isinstance(manifest[key], dict):
            error(f'{key} must be an object')
    for section, field in (('action', 'default_popup'), ('background', 'service_worker'), ('options_ui', 'page'), ('side_panel', 'default_path')):
        obj = manifest.get(section)
        if isinstance(obj, dict) and (field in obj or section != 'action') and (not isinstance(obj.get(field), str) or not obj.get(field)):
            error(f'{section}.{field} must be a non-empty string')
    for section in (manifest.get('icons'), manifest.get('action', {}).get('default_icon') if isinstance(manifest.get('action'), dict) else None):
        if isinstance(section, dict) and any(not isinstance(v, str) or not v or not str(k).isdigit() or len(str(k)) > 5 or int(k) <= 0 for k, v in section.items()):
            error('icon sizes must be positive numeric keys with non-empty file paths')
        elif section is not None and not isinstance(section, (dict, str)):
            error('default_icon must be a path or size-to-path object')
    background = manifest.get('background')
    if isinstance(background, dict) and 'type' in background and background['type'] not in ('classic', 'module'):
        error('background.type must be classic or module')
    options = manifest.get('options_ui')
    if isinstance(options, dict) and 'open_in_tab' in options and type(options['open_in_tab']) is not bool:
        error('options_ui.open_in_tab must be boolean')
    for key in ('options_page', 'devtools_page'):
        if key in manifest and (not isinstance(manifest[key], str) or not manifest[key]):
            error(f'{key} must be a non-empty string')
    permissions = []
    for key in ('permissions', 'optional_permissions', 'host_permissions', 'optional_host_permissions'):
        values = manifest.get(key, [])
        if not isinstance(values, list) or any(not isinstance(v, str) or not v for v in values):
            error(f'{key} must be an array of non-empty strings')
        else:
            permissions.extend(values)
            if key in ('host_permissions', 'optional_host_permissions') and any(not valid_match(v) for v in values):
                error(f'{key} includes an invalid Chrome match pattern')
    for section, keys in (('content_scripts', ('matches', 'js', 'css')), ('web_accessible_resources', ('resources', 'matches'))):
        if section not in manifest: continue
        entries = manifest[section]
        if not isinstance(entries, list):
            error(f'{section} must be an array'); continue
        for entry in entries:
            if not isinstance(entry, dict):
                error(f'{section} entries must be objects'); continue
            for key in keys:
                if key in entry and (not isinstance(entry[key], list) or any(not isinstance(v, str) or not v for v in entry[key])):
                    error(f'{section}.{key} must be an array of non-empty strings')
            if section == 'content_scripts' and (not isinstance(entry.get('matches'), list) or not entry['matches']):
                error('content_scripts requires non-empty matches')
            if section == 'content_scripts' and not entry.get('js') and not entry.get('css'):
                error('content_scripts requires js or css assets')
            matches = entry.get('matches')
            if isinstance(matches, list) and any(not isinstance(v, str) or not valid_match(v) for v in matches):
                error(f'{section}.matches includes an invalid Chrome match pattern')
            if section == 'content_scripts':
                for key, choices in (('run_at', ('document_start', 'document_end', 'document_idle')), ('world', ('ISOLATED', 'MAIN'))):
                    if key in entry and entry[key] not in choices: error(f'content_scripts.{key} is invalid')
                for key in ('all_frames', 'match_about_blank', 'match_origin_as_fallback'):
                    if key in entry and type(entry[key]) is not bool: error(f'content_scripts.{key} must be boolean')
            else:
                if not isinstance(entry.get('resources'), list) or not entry['resources']: error('web_accessible_resources requires non-empty resources')
                ids = entry.get('extension_ids')
                if ids is not None and (not isinstance(ids, list) or any(not isinstance(v, str) or not (v == '*' or re.fullmatch('[a-p]{32}', v)) for v in ids)):
                    error('web_accessible_resources.extension_ids is invalid')
                if not matches and not ids: error('web_accessible_resources requires matches or extension_ids')
                if 'use_dynamic_url' in entry and type(entry['use_dynamic_url']) is not bool: error('web_accessible_resources.use_dynamic_url must be boolean')
    for ref in referenced_files(manifest):
        try:
            if '*' in ref:
                if '..' in Path(ref).parts or Path(ref).is_absolute() or '\\' in ref:
                    error(f'unsafe resource path: {ref}')
                elif not list(root.glob(ref)): error(f'referenced resource pattern has no files: {ref}')
            elif not relative_file(root, ref).is_file():
                error(f'referenced file is missing: {ref}')
        except (ValueError, OSError) as exc: error(f'unsafe referenced path {ref}: {exc}')
    for current, dirnames, filenames in os.walk(root, followlinks=False):
        directory = Path(current)
        for name in list(dirnames):
            if (directory / name).is_symlink():
                error(f'symlink is not allowed: {(directory / name).relative_to(root)}'); dirnames.remove(name)
            elif name in SKIP_PARTS: dirnames.remove(name)
        for name in filenames:
            path = directory / name
            relative = path.relative_to(root)
            if path.is_symlink(): error(f'symlink is not allowed: {relative}'); continue
            if not path.is_file(): error(f'not a regular file: {relative}'); continue
            if sensitive_file(relative): error(f'sensitive or backend artifact cannot ship in extension: {relative}'); continue
            if path.suffix.lower() not in {'.js', '.mjs', '.html', '.css', '.json'}: continue
            try: source = path.read_text(encoding='utf-8')
            except (OSError, UnicodeError) as exc:
                error(f'cannot inspect {relative}: {exc}'); continue
            if path.suffix.lower() in {'.js', '.mjs'} and any(p.search(source) for p in REMOTE_PATTERNS):
                error(f'potential remote or dynamic code pattern found in {relative}')
            if path.suffix.lower() == '.html':
                parser = AssetParser(); parser.feed(source)
                if parser.inline: error(f'inline executable script or event handler found in {relative}')
                for asset, executable in parser.assets:
                    url = urlsplit(asset)
                    if url.scheme or url.netloc:
                        if executable: error(f'remote executable asset found in {relative}: {asset}')
                        else: result['warnings'].append(f'external display asset requires privacy/CSP review: {relative}')
                    else:
                        try:
                            target = (directory / unquote(url.path)).relative_to(root).as_posix()
                            if not relative_file(root, target).is_file(): error(f'HTML asset is missing: {target}')
                        except ValueError: error(f'unsafe HTML asset: {asset}')
    if any(p in BROAD for p in permissions):
        result['warnings'].append('broad hosts need documented necessity; consider activeTab or exact optional hosts')
    result['info'].append('Static heuristics only; browser behavior, auth, privacy and Store review require separate evidence.')
    result['info'].append(f'checked {root}')
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('extension', type=Path)
    parser.add_argument('--json', action='store_true', dest='as_json')
    args = parser.parse_args()
    result = validate_extension(args.extension)
    if args.as_json: print(json.dumps(result, indent=2))
    else:
        for level, messages in result.items():
            for message in messages: print(f'{level.upper()}: {message}')
    raise SystemExit(bool(result['errors']))


if __name__ == '__main__': main()
