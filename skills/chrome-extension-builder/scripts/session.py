#!/usr/bin/env python3
"""Record a resumable local build workflow with artifact integrity checks."""
from __future__ import annotations
import argparse
import hashlib
import json
import os
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from tool_paths import safe_path, relative_file
from project_lock import project_lock
from project_guard import project_root, guarded_artifact
from contextlib import nullcontext
from bounded_json import load_json, bounded_tree, MAX_STATE_BYTES

STAGES = ('research', 'architecture', 'design', 'build', 'test', 'release')


def digest(path: Path) -> str:
    if not path.is_file() or path.stat().st_size == 0: raise ValueError(f'evidence must be a non-empty regular file: {path}')
    return hashlib.sha256(path.read_bytes()).hexdigest()


def state_path(root: Path) -> Path:
    return relative_file(root, '.extension-builder/project.json')


def write_state(path: Path, state: dict, *, initial=False):
    bounded_tree(state)
    serialized = json.dumps(state, indent=2, ensure_ascii=False, allow_nan=False) + '\n'
    if len(serialized.encode('utf-8')) > MAX_STATE_BYTES:
        raise ValueError('project record exceeds 4 MiB; export/review records before continuing')
    history = state.get('history', [])
    if not isinstance(history, list) or len(history) > 1000:
        raise ValueError('project history limit reached; export/review before continuing')
    path.parent.mkdir(parents=True, exist_ok=True)
    descriptor, name = tempfile.mkstemp(prefix='.session-', dir=path.parent)
    temp = Path(name)
    try:
        with os.fdopen(descriptor, 'w', encoding='utf-8') as stream:
            stream.write(serialized)
        safe_path(path)
        if initial: os.link(temp, path)
        else: os.replace(temp, path)
    finally:
        temp.unlink(missing_ok=True)


def load_state(root: Path, *, check_integrity=True, allow_rebind=False) -> dict:
    root = project_root(root)
    state = load_json(state_path(root))
    if not isinstance(state, dict) or type(state.get('schema_version')) is not int or state['schema_version'] != 1 or not isinstance(state.get('mode'), str) or state['mode'] not in {'local', 'cloud', 'hybrid'} or not isinstance(state.get('stages'), dict) or set(state['stages']) != set(STAGES):
        raise ValueError('invalid project state; restore the last valid state rather than overwriting it')
    if 'intelligence' in state:
        # Local import avoids a module cycle while validating both shared writers.
        from intelligence_records import ensure_intelligence
        ensure_intelligence(state, root, allow_rebind=allow_rebind)
    history = state.get('history', [])
    if not isinstance(history, list) or len(history) > 1000:
        raise ValueError('project history limit reached; preserve and export/review the existing record')
    pending_seen = False
    for stage in STAGES:
        item = state['stages'][stage]
        if not isinstance(item, dict) or item.get('status') not in {'pending', 'evidenced'}: raise ValueError(f'invalid stage: {stage}')
        if item['status'] == 'pending': pending_seen = True
        else:
            if pending_seen: raise ValueError('stages are out of sequence')
            evidence, checksum = item.get('evidence'), item.get('sha256')
            if not isinstance(evidence, str) or not isinstance(checksum, str): raise ValueError(f'invalid evidence: {stage}')
            artifact = guarded_artifact(root, evidence, require_file=check_integrity)
            revision = state.get('intelligence', {}).get('context_revision', 0)
            if check_integrity and item.get('context_revision', 0) != revision:
                raise ValueError(f'evidence is stale for {stage} after accepted requirement/architecture changes; explicitly invalidate and re-record it')
            if check_integrity and digest(artifact) != checksum: raise ValueError(f'evidence changed for {stage}; review and re-record that artifact before continuing')
    return state


def report(state: dict) -> dict:
    complete = all(v['status'] == 'evidenced' for v in state['stages'].values())
    return {**state, 'status': 'local-workflow-complete' if complete else 'in-progress', 'next_stage': next((s for s in STAGES if state['stages'][s]['status'] == 'pending'), None), 'browser_verified': False, 'store_published': False, 'notice': 'Artifact existence and integrity are recorded; semantic quality, browser execution and Store publication are not verified by this tracker.'}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest='command', required=True)
    init = commands.add_parser('init'); init.add_argument('path', type=Path); init.add_argument('--name', required=True); init.add_argument('--mode', required=True, choices=('local', 'cloud', 'hybrid'))
    status = commands.add_parser('status'); status.add_argument('path', type=Path)
    advance = commands.add_parser('advance'); advance.add_argument('path', type=Path); advance.add_argument('--stage', required=True, choices=STAGES); advance.add_argument('--evidence', required=True)
    invalidate = commands.add_parser('invalidate'); invalidate.add_argument('path', type=Path); invalidate.add_argument('--stage', required=True, choices=STAGES); invalidate.add_argument('--reason', required=True)
    args = parser.parse_args()
    try:
        root = project_root(args.path)
        with (nullcontext() if args.command == 'status' else project_lock(root, create=args.command == 'init')):
            if args.command == 'init':
                if not args.name.strip(): raise ValueError('name cannot be empty')
                root.mkdir(parents=True, exist_ok=True)
                state = {'schema_version': 1, 'name': args.name.strip(), 'mode': args.mode, 'created_at': datetime.now(timezone.utc).isoformat(), 'graph': {s: ([STAGES[i-1]] if i else []) for i, s in enumerate(STAGES)}, 'stages': {s: {'status': 'pending'} for s in STAGES}}
                write_state(state_path(root), state, initial=True)
            else:
                state = load_state(root, check_integrity=args.command != 'invalidate')
                if args.command == 'invalidate':
                    if not args.reason.strip(): raise ValueError('invalidation requires a non-empty reason')
                    index = STAGES.index(args.stage)
                    if len(state.get('history', [])) >= 1000:
                        raise ValueError('project history limit reached; export/review before invalidating another stage')
                    previous = {s: state['stages'][s] for s in STAGES[index:]}
                    for stage in STAGES[index:]: state['stages'][stage] = {'status': 'pending'}
                    state.setdefault('history', []).append({'action': 'invalidate', 'stage': args.stage, 'reason': args.reason.strip(), 'previous': previous, 'recorded_at': datetime.now(timezone.utc).isoformat()})
                    write_state(state_path(root), state)
                if args.command == 'advance':
                    index = STAGES.index(args.stage)
                    if any(state['stages'][s]['status'] != 'evidenced' for s in STAGES[:index]): raise ValueError('previous stages require evidence before advancing')
                    artifact = guarded_artifact(root, args.evidence)
                    if artifact == state_path(root): raise ValueError('project state cannot be its own evidence')
                    if state['stages'][args.stage]['status'] != 'pending': raise ValueError('stage already evidenced; preserve its audit trail')
                    state['stages'][args.stage] = {'status': 'evidenced', 'evidence': artifact.relative_to(root).as_posix(), 'sha256': digest(artifact), 'recorded_at': datetime.now(timezone.utc).isoformat()}
                    if 'intelligence' in state:
                        state['stages'][args.stage]['context_revision'] = state['intelligence'].get('context_revision', 0)
                    write_state(state_path(root), state)
            print(json.dumps(report(state), indent=2))
    except (OSError, ValueError, KeyError, TypeError) as exc: raise SystemExit(str(exc))


if __name__ == '__main__': main()
