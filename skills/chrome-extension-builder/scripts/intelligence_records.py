"""Bounded, provenance-aware local project records; no network or scheduler client."""
from __future__ import annotations
import hashlib
import json
import re
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import parse_qsl, urlsplit
from uuid import UUID, uuid4
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError
from project_guard import guarded_artifact
from bounded_json import bounded_tree, load_json
from session import digest, state_path
from tool_paths import relative_file

MAX_INPUT_BYTES = 262144
COLLECTION_LIMIT = 1000
CONTEXT_FIELDS = {'goal', 'audience', 'acceptance_journey', 'constraints', 'current_task', 'next_action'}
CONFIDENCE = {'confirmed', 'observed', 'provisional'}
EVIDENCE_STATUS = {'verified', 'failed', 'not-run', 'not-applicable'}
OUTCOMES = {'useful', 'partly-useful', 'blocked', 'failed', 'unchanged', 'unrun'}
SECRET = re.compile(r'(?:-----BEGIN [A-Z ]*PRIVATE KEY-----|\b(?:sk-[A-Za-z0-9_-]{10,}|gh[pousr]_[A-Za-z0-9]{10,}|AKIA[A-Z0-9]{16}|xox[baprs]-[A-Za-z0-9-]{10,})|\b(?:api[_ -]?key|secret|password|access[_ -]?token|refresh[_ -]?token|authorization)\s*[:=]\s*\S+|\bBearer\s+\S+|\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)', re.I)


def now() -> str:
    return datetime.now(timezone.utc).isoformat()


def fingerprint(root: Path) -> str:
    return hashlib.sha256(str(root).encode('utf-8')).hexdigest()


def sanitized(value):
    """Reject obvious credentials/code dumps; this is not a complete PII or secret detector."""
    bounded_tree(value)
    if isinstance(value, str):
        if SECRET.search(value) or '```' in value or '<script' in value.lower():
            raise ValueError('input contains a possible credential or source/transcript dump; supply a concise sanitized summary')
        for candidate in re.findall(r'https?://[^\s<>()]+', value):
            url = urlsplit(candidate)
            if url.username or url.password or any(re.search(r'(?:token|secret|password|api.?key|authorization|^key$)', key, re.I) for key, _ in parse_qsl(url.query)):
                raise ValueError('input contains a private credential-bearing URL; remove credentials and sensitive query fields')
    elif isinstance(value, dict):
        for key, item in value.items():
            if key in {'transcript', 'source_code', 'raw_logs', 'credentials', 'password', 'api_key', 'token'}:
                raise ValueError('raw or credential fields are not accepted')
            sanitized(item)
    elif isinstance(value, list):
        for item in value:
            sanitized(item)
    return value


def text(value, label, *, optional=False, maximum=2000):
    if optional and value is None:
        return ''
    if not isinstance(value, str) or not value.strip() or len(value) > maximum or any(ord(c) < 32 and c not in '\n\t' for c in value):
        raise ValueError(f'{label} must be a non-empty string of at most {maximum} characters')
    return sanitized(value.strip())


def identifier(value, label='id'):
    if not isinstance(value, str) or not re.fullmatch(r'[a-zA-Z0-9][a-zA-Z0-9_.:-]{0,99}', value):
        raise ValueError(f'{label} must be a short opaque identifier')
    return value


def strings(value, label, *, identifiers=False):
    if not isinstance(value, list) or len(value) > 100:
        raise ValueError(f'{label} must be an array with at most 100 items')
    result = [(identifier(v, label) if identifiers else text(v, label, maximum=1000)) for v in value]
    if identifiers and len(result) != len(set(result)):
        raise ValueError(f'{label} contains duplicate IDs')
    return result


def fields(payload, allowed, required=()):
    if not isinstance(payload, dict) or set(payload) - set(allowed):
        raise ValueError('input must be an object containing only documented fields')
    if set(required) - set(payload):
        raise ValueError('input is missing required fields: ' + ', '.join(sorted(set(required) - set(payload))))
    sanitized(payload)


def artifact_path(root: Path, value: str, *, state_ok=False):
    value = text(value, 'artifact path', maximum=500)
    return guarded_artifact(root, value, state_ok=state_ok)


def read_input(root: Path, value: str):
    path = artifact_path(root, value)
    if path.suffix.lower() != '.json' or path.stat().st_size > MAX_INPUT_BYTES:
        raise ValueError('input must be a project-relative JSON file no larger than 256 KiB')
    return sanitized(load_json(path, maximum=MAX_INPUT_BYTES))


def fresh_intelligence(root: Path):
    return {'schema_version': 1, 'identity': {'project_id': str(uuid4()), 'root_sha256': fingerprint(root)}, 'context': {}, 'context_provenance': {}, 'context_revision': 0, 'decisions': [], 'evidence': [], 'feedback': [], 'outcomes': [], 'jobs': [], 'activity': []}


def ensure_intelligence(state, root, *, allow_rebind=False):
    text(state.get('name'), 'project name')
    if 'intelligence' not in state:
        state['intelligence'] = fresh_intelligence(root)
    value = state['intelligence']
    if not isinstance(value, dict) or type(value.get('schema_version')) is not int or value['schema_version'] != 1:
        raise ValueError('invalid intelligence schema; preserve the record and restore a valid copy')
    identity = value.get('identity')
    if not isinstance(identity, dict) or not isinstance(identity.get('root_sha256'), str) or not re.fullmatch('[a-f0-9]{64}', identity['root_sha256']):
        raise ValueError('invalid project identity')
    if not isinstance(identity.get('project_id'), str):
        raise ValueError('invalid project identity')
    UUID(identity['project_id'])
    if identity['root_sha256'] != fingerprint(root) and not allow_rebind:
        raise ValueError('project location changed; review the transferred context and use explicit rebind with its project ID')
    if not isinstance(value.get('context'), dict) or not isinstance(value.get('context_provenance'), dict):
        raise ValueError('invalid stored context')
    sanitized(value)
    for collection in ('decisions', 'evidence', 'feedback', 'outcomes', 'jobs', 'activity'):
        items = value.get(collection)
        if not isinstance(items, list) or len(items) > COLLECTION_LIMIT or any(not isinstance(item, dict) for item in items):
            raise ValueError(f'invalid stored {collection}')
        if collection != 'activity':
            ids = [identifier(item.get('id')) for item in items]
            if len(ids) != len(set(ids)):
                raise ValueError(f'duplicate stored {collection} identity')
    for item in value['evidence']:
        if item.get('status') not in EVIDENCE_STATUS or not isinstance(item.get('sha256'), str) or not re.fullmatch('[a-f0-9]{64}', item['sha256']):
            raise ValueError('invalid stored evidence')
        relative_file(root, item.get('path', ''))
        for key in ('artifact', 'environment', 'category', 'recorded_at'):
            text(item.get(key), key)
    for item in value['decisions']:
        if item.get('confidence') not in CONFIDENCE or item.get('status') not in {'current', 'superseded'}:
            raise ValueError('invalid stored decision')
        for key in ('key', 'value', 'source', 'scope'):
            text(item.get(key), key)
        strings(item.get('evidence_ids'), 'evidence_ids', identifiers=True)
    for item in value['outcomes']:
        if item.get('origin') not in {'human', 'scheduled', 'retry'} or item.get('outcome') not in OUTCOMES:
            raise ValueError('invalid stored outcome')
    for item in value['feedback']:
        if item.get('product') not in {'builder', 'extension'}:
            raise ValueError('invalid stored feedback identity')
    for item in value['jobs']:
        if item.get('state') not in {'proposed', 'activation-recorded', 'paused', 'stopped'}:
            raise ValueError('invalid stored job state')
    validate_stored(value, root)
    return value



def timestamp(value, label='recorded_at'):
    value = text(value, label, maximum=100)
    try:
        parsed = datetime.fromisoformat(value.replace('Z', '+00:00'))
    except ValueError as exc:
        raise ValueError(f'{label} must be an ISO timestamp') from exc
    if parsed.tzinfo is None:
        raise ValueError(f'{label} requires an explicit timezone')
    return value


def validate_stored(value, root):
    """Reject malformed stored records before a mutation can perpetuate them."""
    revision = value.get('context_revision', 0)
    if type(revision) is not int or not 0 <= revision <= 1000000:
        raise ValueError('invalid stored context revision')
    context = value['context']
    sources = value['context_provenance']
    if set(context) - CONTEXT_FIELDS or set(context) != set(sources):
        raise ValueError('stored context and provenance fields do not match')
    for key, item in context.items():
        if key in {'acceptance_journey', 'constraints'}:
            strings(item, key)
        else:
            text(item, key)
        source = sources[key]
        fields(source, {'confidence', 'source', 'scope', 'evidence_ids', 'recorded_at'}, {'confidence', 'source', 'scope', 'evidence_ids', 'recorded_at'})
        if source['confidence'] not in CONFIDENCE:
            raise ValueError('invalid stored context confidence')
        text(source['source'], 'source'); text(source['scope'], 'scope')
        strings(source['evidence_ids'], 'evidence_ids', identifiers=True)
        timestamp(source['recorded_at'])
    evidence_ids = {item['id'] for item in value['evidence']}
    for item in value['evidence']:
        required = {'id', 'path', 'sha256', 'artifact', 'environment', 'category', 'status', 'recorded_at'}
        fields(item, required | {'context_revision'}, required)
        guarded_artifact(root, item['path'], require_file=False)
        if type(item.get('context_revision', 0)) is not int or not 0 <= item.get('context_revision', 0) <= revision:
            raise ValueError('invalid evidence context revision')
        timestamp(item['recorded_at'])
    for item in value['decisions']:
        required = {'id', 'key', 'value', 'confidence', 'source', 'scope', 'evidence_ids', 'recorded_at', 'status', 'supersedes'}
        fields(item, required, required)
        timestamp(item['recorded_at'])
        strings(item['supersedes'], 'supersedes', identifiers=True)
        if set(item['evidence_ids']) - evidence_ids:
            raise ValueError('stored decision references unknown evidence')
    for source in sources.values():
        if set(source['evidence_ids']) - evidence_ids:
            raise ValueError('stored context references unknown evidence')
        if source['confidence'] == 'observed' and not source['evidence_ids']:
            raise ValueError('stored observed context requires evidence')
    for item in value['feedback']:
        required = {'id', 'product', 'package_version', 'host', 'task_category', 'outcome', 'issue_category', 'note', 'evidence_ids', 'recorded_at'}
        fields(item, required, required)
        for key in ('package_version', 'host', 'task_category'):
            text(item[key], key, maximum=100)
        if item['outcome'] not in {'useful', 'partly-useful', 'blocked'} or item['issue_category'] not in {'reproducible-defect', 'confusing-experience', 'context-failure', 'inaccurate-claim', 'feature-request'}:
            raise ValueError('invalid stored feedback classification')
        text(item['note'] or None, 'note', optional=True, maximum=500)
        ids = strings(item['evidence_ids'], 'evidence_ids', identifiers=True)
        if set(ids) - evidence_ids:
            raise ValueError('stored feedback references unknown evidence')
        timestamp(item['recorded_at'])
    job_ids = {item['id'] for item in value['jobs']}
    prior_outcomes = set()
    for item in value['outcomes']:
        required = {'id', 'origin', 'intent', 'outcome', 'summary', 'changed', 'can_do_now', 'blocked', 'next_action', 'evidence_ids', 'recorded_at', 'notification'}
        optional = {'session_id', 'input_fingerprint', 'job_id', 'parent_run_id'}
        fields(item, required | optional, required)
        for key in ('intent', 'summary'):
            text(item[key], key)
        text(item['next_action'] or None, 'next action', optional=True)
        for key in ('changed', 'can_do_now', 'blocked'):
            strings(item[key], key)
        ids = strings(item['evidence_ids'], 'evidence_ids', identifiers=True)
        if set(ids) - evidence_ids:
            raise ValueError('stored outcome references unknown evidence')
        for key in optional & set(item):
            identifier(item[key], key)
        if item['origin'] == 'scheduled' and item.get('job_id') not in job_ids:
            raise ValueError('stored scheduled run requires a known job')
        if item['origin'] == 'retry' and item.get('parent_run_id') not in prior_outcomes:
            raise ValueError('stored retry requires an earlier outcome')
        if item['origin'] == 'human' and ('job_id' in item or 'parent_run_id' in item):
            raise ValueError('stored human session is relabelled as automation')
        if item['notification'] not in {'none', 'suppressed', 'digest', 'actionable'}:
            raise ValueError('invalid stored notification state')
        timestamp(item['recorded_at'])
        prior_outcomes.add(item['id'])
    for item in value['jobs']:
        required = {'id', 'kind', 'source_identifier', 'timezone', 'cadence', 'context_pointer', 'allowed_actions', 'allowed_tools', 'budget_minutes', 'notification', 'state', 'scheduler_verified', 'scheduler_executed_by_plugin', 'host_control_applied', 'last_successful_checkpoint', 'recorded_at'}
        fields(item, required | {'activation', 'updated_at'}, required)
        if item['kind'] not in {'continuation', 'feedback-triage', 'compatibility', 'release-readiness', 'post-release'}:
            raise ValueError('invalid stored job kind')
        for key in ('source_identifier', 'timezone', 'cadence'):
            text(item[key], key)
        try:
            ZoneInfo(item['timezone'])
        except ZoneInfoNotFoundError as exc:
            raise ValueError('invalid stored job timezone') from exc
        guarded_artifact(root, item['context_pointer'], state_ok=True, require_file=False)
        actions = strings(item['allowed_actions'], 'allowed actions')
        if not actions or set(actions) - {'inspect', 'report', 'prepare-local-fix'}:
            raise ValueError('stored job broadens authorized actions')
        strings(item['allowed_tools'], 'allowed tools')
        if type(item['budget_minutes']) is not int or not 1 <= item['budget_minutes'] <= 120 or item['notification'] not in {'actionable', 'digest', 'silent'}:
            raise ValueError('invalid stored job budget/notification')
        if any(item[key] is not False for key in ('scheduler_verified', 'scheduler_executed_by_plugin', 'host_control_applied')):
            raise ValueError('local record cannot claim actual scheduler control or execution')
        if item['state'] == 'activation-recorded' and 'activation' not in item:
            raise ValueError('activation state requires recorded evidence')
        if 'activation' in item:
            activation = item['activation']
            fields(activation, {'host', 'scheduler_reference', 'activation_evidence', 'sha256', 'recorded_at'}, {'host', 'scheduler_reference', 'activation_evidence', 'sha256', 'recorded_at'})
            text(activation['host'], 'host'); identifier(activation['scheduler_reference'])
            guarded_artifact(root, activation['activation_evidence'], require_file=False)
            if not isinstance(activation['sha256'], str) or not re.fullmatch('[a-f0-9]{64}', activation['sha256']):
                raise ValueError('invalid stored activation checksum')
            timestamp(activation['recorded_at'])
        timestamp(item['recorded_at'])
        if 'updated_at' in item:
            timestamp(item['updated_at'])
    for item in value['activity']:
        fields(item, {'action', 'recorded_at'}, {'action', 'recorded_at'})
        text(item['action'], 'activity action', maximum=100)
        timestamp(item['recorded_at'])


def collection_add(intelligence, collection, record):
    items = intelligence[collection]
    if any(item['id'] == record['id'] for item in items):
        raise ValueError('record ID already exists; use a new ID or an explicit decision supersession')
    if len(items) >= COLLECTION_LIMIT:
        raise ValueError('local record limit reached; export and review records before continuing')
    items.append(record)


def evidence_view(root, item, *, revision=None):
    try:
        path = artifact_path(root, item['path'])
        current = digest(path) == item['sha256'] and (revision is None or item.get('context_revision', 0) == revision)
    except (OSError, ValueError):
        current = False
    return {**item, 'recorded_status': item['status'], 'status': item['status'] if current else 'stale', 'integrity': 'current' if current else 'changed-or-unavailable'}


def check_evidence_ids(root, intelligence, ids):
    ids = strings(ids, 'evidence_ids', identifiers=True)
    by_id = {item['id']: item for item in intelligence['evidence']}
    for identity in ids:
        if identity not in by_id:
            raise ValueError(f'unknown evidence ID: {identity}')
        if evidence_view(root, by_id[identity], revision=intelligence.get('context_revision', 0))['status'] == 'stale':
            raise ValueError(f'evidence is stale or unavailable: {identity}')
    return ids


def provenance(root, intelligence, payload):
    fields(payload, {'confidence', 'source', 'scope', 'evidence_ids'}, ('confidence', 'source', 'scope'))
    if payload['confidence'] not in CONFIDENCE:
        raise ValueError('confidence must be confirmed, observed or provisional')
    ids = check_evidence_ids(root, intelligence, payload.get('evidence_ids', []))
    if payload['confidence'] == 'observed':
        by_id = {item['id']: item for item in intelligence['evidence']}
        if not ids or any(by_id[i]['status'] not in {'verified', 'failed'} for i in ids):
            raise ValueError('observed statements require current observed pass/fail evidence')
    return {'confidence': payload['confidence'], 'source': text(payload['source'], 'source'), 'scope': text(payload['scope'], 'scope'), 'evidence_ids': ids, 'recorded_at': now()}


def record_context(root, intelligence, payload):
    fields(payload, CONTEXT_FIELDS | {'provenance'})
    if not payload or not (set(payload) & CONTEXT_FIELDS):
        raise ValueError('context update needs at least one documented context field')
    sources = payload.get('provenance', {})
    if not isinstance(sources, dict) or set(sources) - (set(payload) & CONTEXT_FIELDS):
        raise ValueError('provenance must describe only context fields changed in this update')
    for key in CONTEXT_FIELDS & set(payload):
        value = strings(payload[key], key) if key in {'acceptance_journey', 'constraints'} else text(payload[key], key)
        source = sources.get(key, {'confidence': 'provisional', 'source': 'local input; not independently verified', 'scope': 'current project'})
        recorded = provenance(root, intelligence, source)
        old_source = intelligence['context_provenance'].get(key, {})
        changed = intelligence['context'].get(key) != value
        if changed and old_source.get('confidence') == 'confirmed' and recorded['confidence'] != 'confirmed':
            raise ValueError('a provisional or observed context update cannot overwrite a confirmed choice; record an explicit confirmed correction')
        if changed and key in {'goal', 'audience', 'acceptance_journey', 'constraints'}:
            intelligence['context_revision'] = intelligence.get('context_revision', 0) + 1
        intelligence['context'][key] = value
        intelligence['context_provenance'][key] = recorded


def record_decision(root, intelligence, payload):
    allowed = {'id', 'key', 'value', 'confidence', 'source', 'scope', 'evidence_ids', 'supersedes'}
    fields(payload, allowed, ('id', 'key', 'value', 'confidence', 'source', 'scope'))
    source = provenance(root, intelligence, {k: payload[k] for k in ('confidence', 'source', 'scope', 'evidence_ids') if k in payload})
    record = {'id': identifier(payload['id']), 'key': text(payload['key'], 'key', maximum=100), 'value': text(payload['value'], 'value'), **source, 'status': 'current', 'supersedes': strings(payload.get('supersedes', []), 'supersedes', identifiers=True)}
    previous = {item['id']: item for item in intelligence['decisions']}
    for identity in record['supersedes']:
        prior = previous.get(identity)
        if prior is None or prior['key'] != record['key'] or prior['scope'] != record['scope']:
            raise ValueError('supersession must identify an existing decision with the same key and scope')
        if prior['confidence'] == 'confirmed' and record['confidence'] != 'confirmed':
            raise ValueError('a provisional or observed inference cannot replace a confirmed user decision')
    collection_add(intelligence, 'decisions', record)
    material = any(word in record['key'].lower() for word in ('surface', 'architecture', 'permission', 'data', 'auth', 'backend', 'storage', 'cloud', 'api'))
    if material and any(previous[identity]['value'] != record['value'] for identity in record['supersedes']):
        intelligence['context_revision'] = intelligence.get('context_revision', 0) + 1
    for identity in record['supersedes']:
        previous[identity]['status'] = 'superseded'


def record_evidence(root, intelligence, payload):
    fields(payload, {'id', 'path', 'artifact', 'environment', 'category', 'status'}, ('id', 'path', 'artifact', 'environment', 'category', 'status'))
    if payload['status'] not in EVIDENCE_STATUS:
        raise ValueError('evidence status must be verified, failed, not-run or not-applicable')
    path = artifact_path(root, payload['path'])
    if path == state_path(root):
        raise ValueError('project state cannot be its own evidence')
    record = {'id': identifier(payload['id']), 'path': path.relative_to(root).as_posix(), 'sha256': digest(path), 'artifact': text(payload['artifact'], 'artifact'), 'environment': text(payload['environment'], 'environment'), 'category': text(payload['category'], 'category', maximum=100), 'status': payload['status'], 'context_revision': intelligence.get('context_revision', 0), 'recorded_at': now()}
    collection_add(intelligence, 'evidence', record)


def record_feedback(root, intelligence, payload):
    allowed = {'id', 'product', 'package_version', 'host', 'task_category', 'outcome', 'issue_category', 'note', 'evidence_ids'}
    fields(payload, allowed, allowed - {'note', 'evidence_ids'})
    if payload['product'] not in {'builder', 'extension'} or payload['outcome'] not in {'useful', 'partly-useful', 'blocked'}:
        raise ValueError('feedback needs a separate builder/extension identity and useful/partly-useful/blocked outcome')
    if payload['issue_category'] not in {'reproducible-defect', 'confusing-experience', 'context-failure', 'inaccurate-claim', 'feature-request'}:
        raise ValueError('invalid issue category')
    record = {key: text(payload[key], key, maximum=100) for key in ('package_version', 'host', 'task_category')}
    record.update({'id': identifier(payload['id']), 'product': payload['product'], 'outcome': payload['outcome'], 'issue_category': payload['issue_category'], 'note': text(payload.get('note'), 'note', optional=True, maximum=500), 'evidence_ids': check_evidence_ids(root, intelligence, payload.get('evidence_ids', [])), 'recorded_at': now()})
    collection_add(intelligence, 'feedback', record)


def record_job(root, intelligence, payload):
    required = {'id', 'kind', 'source_identifier', 'timezone', 'cadence', 'context_pointer', 'allowed_actions', 'allowed_tools', 'budget_minutes', 'notification'}
    fields(payload, required, required)
    if payload['kind'] not in {'continuation', 'feedback-triage', 'compatibility', 'release-readiness', 'post-release'}:
        raise ValueError('unknown follow-up kind')
    zone = text(payload['timezone'], 'timezone', maximum=100)
    try:
        ZoneInfo(zone)
    except ZoneInfoNotFoundError as exc:
        raise ValueError('timezone must be an available IANA timezone') from exc
    pointer = artifact_path(root, payload['context_pointer'], state_ok=True)
    actions = strings(payload['allowed_actions'], 'allowed_actions')
    if not actions or set(actions) - {'inspect', 'report', 'prepare-local-fix'}:
        raise ValueError('allowed actions are inspect, report or prepare-local-fix; execution/publication authority is not granted')
    budget = payload['budget_minutes']
    if type(budget) is not int or not 1 <= budget <= 120:
        raise ValueError('budget_minutes must be an integer from 1 to 120')
    if payload['notification'] not in {'actionable', 'digest', 'silent'}:
        raise ValueError('notification must be actionable, digest or silent')
    record = {'id': identifier(payload['id']), 'kind': payload['kind'], 'source_identifier': text(payload['source_identifier'], 'source identifier'), 'timezone': zone, 'cadence': text(payload['cadence'], 'cadence', maximum=200), 'context_pointer': pointer.relative_to(root).as_posix(), 'allowed_actions': actions, 'allowed_tools': strings(payload['allowed_tools'], 'allowed_tools'), 'budget_minutes': budget, 'notification': payload['notification'], 'state': 'proposed', 'scheduler_verified': False, 'scheduler_executed_by_plugin': False, 'host_control_applied': False, 'last_successful_checkpoint': None, 'recorded_at': now()}
    collection_add(intelligence, 'jobs', record)


def job_state(root, intelligence, identity, new_state, payload=None):
    job = next((item for item in intelligence['jobs'] if item['id'] == identity), None)
    if job is None:
        raise ValueError('unknown job ID')
    if new_state == 'activation-recorded':
        if job['state'] == 'stopped':
            raise ValueError('stopped job remains stopped; create a new reviewed specification')
        fields(payload, {'host', 'scheduler_reference', 'activation_evidence'}, ('host', 'scheduler_reference', 'activation_evidence'))
        path = artifact_path(root, payload['activation_evidence'])
        job['activation'] = {'host': text(payload['host'], 'host', maximum=100), 'scheduler_reference': identifier(payload['scheduler_reference'], 'scheduler reference'), 'activation_evidence': path.relative_to(root).as_posix(), 'sha256': digest(path), 'recorded_at': now()}
    elif payload is not None:
        raise ValueError('pause and stop record local intent only and do not accept activation input')
    job['state'] = new_state
    job['host_control_applied'] = False
    job['updated_at'] = now()


def record_outcome(root, intelligence, payload):
    allowed = {'id', 'origin', 'session_id', 'intent', 'outcome', 'summary', 'changed', 'can_do_now', 'blocked', 'next_action', 'evidence_ids', 'job_id', 'parent_run_id', 'input_fingerprint'}
    fields(payload, allowed, ('id', 'origin', 'intent', 'outcome', 'summary'))
    if payload['origin'] not in {'human', 'scheduled', 'retry'} or payload['outcome'] not in OUTCOMES:
        raise ValueError('invalid outcome or run origin')
    record = {'id': identifier(payload['id']), 'origin': payload['origin'], 'intent': text(payload['intent'], 'intent', maximum=100), 'outcome': payload['outcome'], 'summary': text(payload['summary'], 'summary'), 'changed': strings(payload.get('changed', []), 'changed'), 'can_do_now': strings(payload.get('can_do_now', []), 'can_do_now'), 'blocked': strings(payload.get('blocked', []), 'blocked'), 'next_action': text(payload.get('next_action'), 'next action', optional=True), 'evidence_ids': check_evidence_ids(root, intelligence, payload.get('evidence_ids', [])), 'recorded_at': now()}
    if 'session_id' in payload:
        record['session_id'] = identifier(payload['session_id'], 'session ID')
    if 'input_fingerprint' in payload:
        record['input_fingerprint'] = identifier(payload['input_fingerprint'], 'input fingerprint')
    if payload['origin'] == 'retry':
        parent_id = identifier(payload.get('parent_run_id'), 'parent run ID')
        parent = next((item for item in intelligence['outcomes'] if item['id'] == parent_id), None)
        if parent is None:
            raise ValueError('retry needs an existing parent outcome')
        record['parent_run_id'] = parent_id
        if parent.get('job_id'):
            record['job_id'] = parent['job_id']
    job = None
    if payload['origin'] == 'scheduled' or 'job_id' in payload or 'job_id' in record:
        identity = identifier(payload.get('job_id', record.get('job_id')), 'job ID')
        job = next((item for item in intelligence['jobs'] if item['id'] == identity), None)
        if job is None or job['state'] != 'activation-recorded':
            raise ValueError('scheduled results require an explicit recorded host activation; proposed/paused/stopped specs are not active authority')
        path = artifact_path(root, job['activation']['activation_evidence'])
        if digest(path) != job['activation']['sha256']:
            raise ValueError('activation evidence is stale')
        record['job_id'] = identity
        if record['outcome'] in {'useful', 'partly-useful'}:
            artifact_path(root, job['context_pointer'], state_ok=True)
            if not record['evidence_ids']:
                raise ValueError('successful scheduled results need current evidence; record blocked/unrun when proof is unavailable')
    if payload['origin'] == 'human' and ('job_id' in payload or 'parent_run_id' in payload):
        raise ValueError('human sessions cannot be relabelled scheduled runs or retries')
    record['notification'] = 'none'
    if job:
        record['notification'] = 'digest' if job['notification'] == 'digest' else 'suppressed'
        if job['notification'] == 'actionable' and (record['changed'] or record['blocked'] or record['outcome'] in {'blocked', 'failed'}):
            prior = [item for item in intelligence['outcomes'] if item.get('job_id') == job['id']]
            same = prior and all(prior[-1].get(key) == record.get(key) for key in ('input_fingerprint', 'summary', 'changed', 'blocked', 'outcome'))
            if not same:
                record['notification'] = 'actionable'
    collection_add(intelligence, 'outcomes', record)
    if job and record['outcome'] in {'useful', 'partly-useful'} and record['evidence_ids']:
        job['last_successful_checkpoint'] = {'outcome_id': record['id'], 'evidence_ids': record['evidence_ids'], 'recorded_at': record['recorded_at']}


RECORDERS = {'context': record_context, 'decision': record_decision, 'evidence': record_evidence, 'feedback': record_feedback, 'outcome': record_outcome, 'job': record_job}
