#!/usr/bin/env python3
"""Validate and package this plugin into isolated, reproducible local bundles."""
import argparse
import hashlib
import json
import re
import tempfile
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
COMMON = ['skills', 'scripts', 'studio', 'docs', 'assets', 'README.md', 'LICENSE', 'PRIVACY.md', 'SECURITY.md', 'SUPPORT.md', 'TERMS.md']
ADAPTERS = {'portable': ['plugin.json'], 'openai': ['plugin.json', '.codex-plugin/plugin.json'], 'codex': ['plugin.json', '.codex-plugin/plugin.json'], 'claude': ['.claude-plugin/plugin.json', 'agents', 'commands'], 'cursor': ['.cursor-plugin/plugin.json'], 'gemini': ['gemini-extension.json']}
SKIP = {'__pycache__', '.DS_Store'}
PRIVATE = {'.env', '.git', 'node_modules', '.extension-builder', '.npmrc', '.netrc', '.dev.vars', '.git-credentials', '.pypirc', '.ssh', 'secrets', 'id_rsa', 'id_ed25519', 'id_ecdsa', 'id_dsa', 'credentials.json', 'service-account.json'}
SENSITIVE_SUFFIXES = {'.pem', '.key', '.p12', '.pfx', '.crt', '.cer', '.sqlite', '.db'}
FORBIDDEN_FILES = {'mcp.json', '.mcp.json', '.app.json', '.lsp.json', 'settings.json', 'hooks.json'}
FORBIDDEN_KEYS = {'mcpServers', 'apps', 'hooks', 'userConfig', 'lspServers', 'dependencies', 'channels'}


def forbidden_declarations(value, path='manifest'):
    errors = []
    if isinstance(value, dict):
        for key, child in value.items():
            if key in FORBIDDEN_KEYS:
                errors.append(f'{path}.{key}: not allowed in this skills-only package')
            errors.extend(forbidden_declarations(child, f'{path}.{key}'))
    elif isinstance(value, list):
        for index, child in enumerate(value):
            errors.extend(forbidden_declarations(child, f'{path}[{index}]'))
    return errors


def selected_files(root, entries):
    files = []
    for entry in entries:
        base = root / entry
        if not base.exists():
            raise ValueError(f'missing distribution entry: {entry}')
        candidates = [base]
        if base.is_dir():
            candidates += list(base.rglob('*'))
        for source in candidates:
            relative = source.relative_to(root)
            if source.is_symlink():
                raise ValueError(f'symlink in distribution: {relative}')
            if any(part in SKIP for part in relative.parts) or source.suffix == '.pyc':
                continue
            if any(part.lower() in PRIVATE or part.lower().startswith(('.env.', '.dev.vars.')) for part in relative.parts) or source.suffix.lower() in SENSITIVE_SUFFIXES:
                raise ValueError(f'private file in distribution: {relative}')
            if source.name.lower() in FORBIDDEN_FILES or relative.parts[0].lower() in {'bin', 'hooks', 'node_modules'}:
                raise ValueError(f'non-skill runtime component in distribution: {relative}')
            if source.is_file():
                files.append(source)
    return sorted(set(files))


def write_zip(root, files, output, prefix=''):
    with zipfile.ZipFile(output, 'x', compression=zipfile.ZIP_DEFLATED) as archive:
        for source in files:
            info = zipfile.ZipInfo(prefix + source.relative_to(root).as_posix(), date_time=(2020, 1, 1, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = (0o100755 if source.suffix in {'.py', '.mjs'} else 0o100644) << 16
            archive.writestr(info, source.read_bytes())


def verify_archive(root, files, archive, prefix=''):
    with tempfile.TemporaryDirectory() as folder:
        with zipfile.ZipFile(archive) as zipped:
            names = zipped.namelist()
            expected = {prefix + source.relative_to(root).as_posix() for source in files}
            if len(names) != len(expected) or set(names) != expected or any(name.startswith('/') or '..' in name.split('/') for name in names):
                raise ValueError('archive members differ from allowlist')
            zipped.extractall(folder)
        for source in files:
            if (Path(folder) / (prefix + source.relative_to(root).as_posix())).read_bytes() != source.read_bytes():
                raise ValueError('archive round-trip mismatch')


def validate(root):
    errors = []
    versions = set()
    metadata = ['plugin.json', '.codex-plugin/plugin.json', '.claude-plugin/plugin.json', '.cursor-plugin/plugin.json', 'gemini-extension.json', 'package.json']
    present = [relative for relative in metadata if (root / relative).is_file()]
    if not any(relative != 'package.json' for relative in present):
        errors.append('one native plugin manifest is required')
    for relative in present:
        try:
            data = json.loads((root / relative).read_text())
            if data['name'] != 'chrome-extension-builder':
                errors.append(f'{relative}: identity mismatch')
            if not re.fullmatch(r'\d+\.\d+\.\d+', data['version']):
                errors.append(f'{relative}: invalid version')
            versions.add(data['version'])
            if relative != 'package.json':
                errors.extend(forbidden_declarations(data, relative))
        except (OSError, ValueError, KeyError, TypeError) as exc:
            errors.append(f'{relative}: {exc}')
    if len(versions) != 1:
        errors.append('manifest versions differ')
    try:
        for relative in ['plugin.json', '.codex-plugin/plugin.json']:
            if not (root / relative).is_file():
                continue
            manifest = json.loads((root / relative).read_text())
            interface = manifest.get('interface', manifest.get('extensions', {}).get('com.openai', {}).get('interface', {}))
            if len(interface.get('shortDescription', '')) > 30:
                errors.append('listing subtitle exceeds 30 characters')
        references = root / 'skills/chrome-extension-builder/references'
        team = json.loads((references / 'team.json').read_text())
        roles = team.get('roles', team.get('agents', []))
        if not roles:
            errors.append('team registry has no roles')
        for role in roles:
            prompt = role.get('agent')
            if not isinstance(prompt, str) or '/' in prompt or not (references / prompt).is_file():
                errors.append(f'missing portable role prompt: {prompt}')
            for skill in role.get('skills', []):
                if not (root / 'skills' / skill / 'SKILL.md').is_file():
                    errors.append(f'unknown team skill: {skill}')
    except (OSError, ValueError, KeyError, TypeError) as exc:
        errors.append(f'registry or interface: {exc}')
    skills = sorted((root / 'skills').glob('*/SKILL.md'))
    if len(skills) < 10:
        errors.append('lifecycle corpus is incomplete')
    for skill in skills:
        text = skill.read_text()
        if not text.startswith('---\n') or f'name: {skill.parent.name}\n' not in text.split('---', 2)[1]:
            errors.append(f'{skill.relative_to(root)}: invalid frontmatter/name')
        if not (skill.parent / 'agents/openai.yaml').is_file():
            errors.append(f'{skill.parent.name}: missing host metadata')
        frontmatter = text.split('---', 2)[1] if text.startswith('---\n') else ''
        fields = dict(line.split(':', 1) for line in frontmatter.splitlines() if ':' in line)
        name = fields.get('name', '').strip()
        description = fields.get('description', '').strip()
        if not re.fullmatch(r'[a-z0-9-]{1,64}', name) or not description or len(description) > 1024 or '<' in description or '>' in description:
            errors.append(f'{skill.relative_to(root)}: invalid skill name/description bounds')
        if len(text.splitlines()) > 500:
            errors.append(f'{skill.relative_to(root)}: split long instructions into references')
        if 'policy-boundaries.md' not in text:
            errors.append(f'{skill.relative_to(root)}: shared policy boundaries are not linked')
    try:
        adapters = [p for p in sorted({p for paths in ADAPTERS.values() for p in paths}) if (root / p).exists()]
        files = selected_files(root, COMMON + adapters)
    except ValueError as exc:
        errors.append(str(exc))
        files = []
    for source in files:
        if source.suffix not in {'.md', '.py', '.js', '.mjs', '.json', '.yaml', '.html', '.css'}:
            continue
        text = source.read_text()
        if re.search(r'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|\bgh[pousr]_[A-Za-z0-9]{30,}\b|\bsk-proj-[A-Za-z0-9_-]{30,}\b', text):
            errors.append(f'{source.relative_to(root)}: possible secret')
        if ('/' + 'Users' + '/') in text:
            errors.append(f'{source.relative_to(root)}: machine-specific absolute path')
        if source.suffix == '.md':
            for target in re.findall(r'\]\(([^)]+)\)', text):
                if '://' in target or target.startswith('#'):
                    continue
                target = target.split('#')[0]
                if target and not (source.parent / target).exists():
                    errors.append(f'{source.relative_to(root)}: broken reference {target}')
    return {'verdict': 'FAIL' if errors else 'PASS', 'errors': errors, 'skillCount': len(skills), 'version': next(iter(versions), None), 'architecture': 'skills-only, no MCP or automatic hooks', 'scope': 'local structural and source checks; not policy approval', 'externalActionPerformed': False}


def bundle(root, output):
    missing = [p for paths in ADAPTERS.values() for p in paths if not (root / p).exists()]
    if missing:
        raise ValueError('Building all provider bundles requires the complete source checkout; this installed adapter can still scaffold, check, package, track sessions, and serve the studio.')
    report = validate(root)
    if report['errors']:
        raise ValueError(json.dumps(report, indent=2))
    if output.exists():
        raise ValueError('distribution output must be a new directory')
    if any(p.is_symlink() for p in [output, *output.parents]):
        raise ValueError('distribution output cannot traverse symlinks')
    output.mkdir(parents=True)
    entries = []
    for platform, adapter in ADAPTERS.items():
        files = selected_files(root, COMMON + adapter)
        archive = output / f'chrome-extension-builder-{report["version"]}-{platform}.zip'
        write_zip(root, files, archive)
        verify_archive(root, files, archive)
        entries.append({'platform': platform, 'archive': archive.name, 'sha256': hashlib.sha256(archive.read_bytes()).hexdigest(), 'files': len(files)})
        if platform == 'portable':
            export = output / f'chrome-extension-builder-{report["version"]}-plugin-creator.zip'
            write_zip(root, files, export, 'chrome-extension-builder/')
            verify_archive(root, files, export, 'chrome-extension-builder/')
            entries.append({'platform': 'plugin-creator', 'archive': export.name, 'sha256': hashlib.sha256(export.read_bytes()).hexdigest(), 'files': len(files), 'layout': 'single named top-level directory'})
    report['bundles'] = entries
    (output / 'release-matrix.json').write_text(json.dumps(report, indent=2) + '\n')
    return report


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action', choices=['validate', 'bundle'])
    parser.add_argument('--output', type=Path)
    args = parser.parse_args()
    try:
        report = validate(ROOT) if args.action == 'validate' else bundle(ROOT, args.output or ROOT / 'dist' / validate(ROOT)['version'])
    except (ValueError, OSError) as exc:
        parser.exit(1, str(exc) + '\n')
    print(json.dumps(report, indent=2))
    raise SystemExit(1 if report['errors'] else 0)


if __name__ == '__main__':
    main()
