"""Read bounded JSON records before recursive consumers or mutable state operations."""
from __future__ import annotations
import json
from pathlib import Path

MAX_STATE_BYTES = 4 * 1024 * 1024
MAX_DEPTH = 12
MAX_NODES = 100000


def bounded_tree(value):
    pending = [(value, 0)]
    nodes = 0
    while pending:
        item, depth = pending.pop()
        nodes += 1
        if depth > MAX_DEPTH or nodes > MAX_NODES:
            raise ValueError('JSON record exceeds supported nesting or item count; export/review and provide a concise flat record')
        if isinstance(item, dict):
            pending.extend((child, depth + 1) for child in item.values())
        elif isinstance(item, list):
            pending.extend((child, depth + 1) for child in item)
    return value


def unique_object(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            raise ValueError('duplicate JSON object keys are not accepted')
        result[key] = value
    return result


def reject_constant(value):
    raise ValueError(f'non-finite JSON numeric constant is not accepted: {value}')


def load_json(path: Path, *, maximum=MAX_STATE_BYTES):
    if not path.is_file() or path.stat().st_size > maximum:
        raise ValueError('JSON record must be a bounded regular file; export/review oversized records before continuing')
    try:
        value = json.loads(path.read_text(encoding='utf-8'), object_pairs_hook=unique_object, parse_constant=reject_constant)
    except RecursionError as exc:
        raise ValueError('JSON record nesting is too deep; provide a concise flat record') from exc
    return bounded_tree(value)
