"""Evidence-linked reporting views over the one local project record."""
from __future__ import annotations
import hashlib
import json
import os
import re
import tempfile
from pathlib import Path
from urllib.parse import quote
from check_extension import sensitive_file
from intelligence_records import artifact_path, evidence_view, now, sanitized, text
from session import digest, STAGES
from tool_paths import relative_file, safe_path

NOTICE = ('This view records supplied context and outcome metadata plus local artifact integrity. '
          'Recorded verified status is a claim supplied with evidence, not independent semantic or browser verification. '
          'No scheduler, browser test, transmission, deployment or Store publication is performed by this helper.')


def stage_view(root, stages, revision=0):
    result = {}
    dependency_stale = False
    for stage in STAGES:
        item = stages[stage]
        entry = dict(item)
        if item['status'] == 'evidenced':
            try:
                path = artifact_path(root, item['evidence'])
                intact = digest(path) == item['sha256'] and item.get('context_revision', 0) == revision
            except (ValueError, OSError):
                intact = False
            if dependency_stale or not intact:
                entry['status'] = 'stale'
                entry['stale_reason'] = 'earlier stage evidence changed' if dependency_stale else 'artifact changed or unavailable'
                dependency_stale = True
            else:
                entry['status'] = 'evidenced'
            entry['recorded_status'] = 'evidenced'
        result[stage] = entry
    return result


def decision_view(root, intelligence):
    evidence = {item['id']: evidence_view(root, item, revision=intelligence.get('context_revision', 0)) for item in intelligence['evidence']}
    records = []
    for item in intelligence['decisions']:
        stale = any(identity not in evidence or evidence[identity]['status'] == 'stale' for identity in item['evidence_ids'])
        records.append({**item, 'evidence_status': 'stale' if stale else ('current' if item['evidence_ids'] else 'not-attached')})
    conflicts = []
    grouped = {}
    for item in records:
        if item['status'] == 'current':
            grouped.setdefault((item['key'], item['scope']), []).append(item)
    for (key, scope), choices in grouped.items():
        if len({item['value'] for item in choices}) > 1:
            conflicts.append({'key': key, 'scope': scope, 'decision_ids': [item['id'] for item in choices], 'status': 'needs-explicit-resolution'})
    return records, conflicts


def builder_export(intelligence):
    """A deliberately narrow sharing view: no free text, paths or project identity."""
    records = []
    for item in intelligence['feedback']:
        if item['product'] == 'builder':
            public = {key: item[key] for key in ('outcome', 'issue_category', 'recorded_at')}
            version = re.fullmatch(r'[0-9]+(?:\.[0-9]+){0,3}', item['package_version'])
            public['package_version'] = item['package_version'] if version else 'unknown'
            public['host'] = item['host'] if item['host'].lower() in {'codex', 'claude', 'cursor', 'chatgpt'} else 'other'
            public['task_category'] = item['task_category'] if item['task_category'] in {'build', 'improve', 'fix', 'audit', 'prepare-release', 'continue', 'test', 'design', 'research'} else 'other'
            records.append(public)
    return {'schema_version': 1, 'kind': 'builder-feedback-aggregate', 'records': records, 'sample_size': len(records), 'scope': 'voluntarily recorded local builder feedback only; no global usage or retention metric', 'redaction': 'Project names, project IDs, report IDs, notes, code, transcripts and evidence paths excluded. Inspect remaining labels before sharing.', 'uploaded': False}


def job_view(root, job):
    entry = dict(job)
    entry['scheduler_verified'] = False
    entry['scheduler_executed_by_plugin'] = False
    entry['host_control_applied'] = False
    activation = job.get('activation')
    if activation:
        try:
            current = digest(artifact_path(root, activation['activation_evidence'])) == activation['sha256']
        except (OSError, ValueError):
            current = False
        entry['activation_integrity'] = 'current' if current else 'stale'
    else:
        entry['activation_integrity'] = 'not-recorded'
    entry['notice'] = 'Local specification/intent only. Activate, pause or stop the actual job in its host and verify a real run separately.'
    return entry


def report_view(root, state, kind):
    intelligence = state['intelligence']
    decisions, conflicts = decision_view(root, intelligence)
    outcomes = intelligence['outcomes']
    humans = [item for item in outcomes if item['origin'] == 'human']
    human_count = len({item['session_id'] for item in humans}) if all(item.get('session_id') for item in humans) else None
    evidence = [evidence_view(root, item, revision=intelligence.get('context_revision', 0)) for item in intelligence['evidence']]
    stamps = [item['recorded_at'] for item in outcomes]
    selected = outcomes
    if kind == 'session':
        selected = outcomes[-1:]
    elif kind == 'scheduled':
        selected = [item for item in outcomes if item['origin'] != 'human']
    result = {
        'schema_version': 1, 'kind': kind,
        'project': {'project_id': intelligence['identity']['project_id'], 'name': text(state['name'], 'project name'), 'mode': state['mode']},
        'generated_at': now(), 'context': intelligence['context'], 'context_provenance': intelligence['context_provenance'],
        'decisions': decisions, 'conflicts': conflicts, 'evidence': evidence,
        'stages': stage_view(root, state['stages'], intelligence.get('context_revision', 0)), 'outcomes': selected,
        'counts': {'human_sessions': human_count, 'scheduled_runs': sum(item['origin'] == 'scheduled' for item in outcomes), 'retries': sum(item['origin'] == 'retry' for item in outcomes), 'sample_size': len(outcomes)},
        'observation_window': {'start': min(stamps) if stamps else None, 'end': max(stamps) if stamps else None, 'basis': 'local outcome recording dates; no publisher or host telemetry'},
        'jobs': [job_view(root, item) for item in intelligence['jobs']],
        'builder_feedback': [item for item in intelligence['feedback'] if item['product'] == 'builder'],
        'extension_feedback': [item for item in intelligence['feedback'] if item['product'] == 'extension'],
        'builder_feedback_export': builder_export(intelligence),
        'browser_verified': False, 'store_published': False, 'scheduler_executed_by_plugin': False,
        'notice': NOTICE,
    }
    if selected:
        latest = selected[-1]
        result['next_action'] = latest['next_action'] or intelligence['context'].get('next_action', '')
    else:
        result['next_action'] = intelligence['context'].get('next_action', '')
    sanitized(result)
    return result


def md_text(value):
    value = str(value).replace('\n', ' ').replace('\r', ' ')
    value = value.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
    for char in ('\\', '[', ']', '*', '_', '`', '|', '#'):
        value = value.replace(char, '\\' + char)
    return value


def markdown_view(result, root, output):
    if result['kind'] == 'builder-feedback-aggregate':
        lines = ['# Builder feedback sharing preview', '', result['redaction'], '', f"Local feedback records: {result['sample_size']}", '', '| Package | Host | Task | Outcome | Issue |', '| --- | --- | --- | --- | --- |']
        for item in result['records']:
            lines.append('| ' + ' | '.join(md_text(item[key]) for key in ('package_version', 'host', 'task_category', 'outcome', 'issue_category')) + ' |')
        lines.extend(['', result['scope'], '', 'No upload performed.'])
        return '\n'.join(lines) + '\n'
    context = result['context']
    lines = [f"# {md_text(result['project']['name'])} — {md_text(result['kind'])} report", '', f"Generated: {md_text(result['generated_at'])}", '', f"Goal: {md_text(context.get('goal', 'Not recorded'))}", '', f"Next action: {md_text(result.get('next_action') or 'Not recorded')}", '', result['notice'], '', '## What changed and what works now', '']
    if result['outcomes']:
        for item in result['outcomes'][-5:]:
            lines.append(f"- {md_text(item['origin'])} / {md_text(item['outcome'])}: {md_text(item['summary'])}")
            for value in item['can_do_now']:
                lines.append(f"  - Can do now: {md_text(value)}")
            for value in item['blocked']:
                lines.append(f"  - Blocked: {md_text(value)}")
    else:
        lines.append('No human or scheduled outcome has been recorded.')
    lines.extend(['', '## Decisions and conflicts', ''])
    if not result['decisions']:
        lines.append('No decisions recorded; no preference is inferred from missing data.')
    for item in result['decisions']:
        lines.append(f"- {md_text(item['key'])}: {md_text(item['value'])} — {md_text(item['confidence'])}, {md_text(item['status'])}; scope: {md_text(item['scope'])}; source: {md_text(item['source'])}; evidence: {md_text(item['evidence_status'])}.")
    for conflict in result['conflicts']:
        lines.append(f"- Needs explicit resolution: {md_text(conflict['key'])} ({md_text(', '.join(conflict['decision_ids']))}).")
    lines.extend(['', '## Evidence and readiness', '', '| Stage | Recorded local state |', '| --- | --- |'])
    for stage, item in result['stages'].items():
        lines.append(f"| {md_text(stage)} | {md_text(item['status'])} |")
    if result['evidence']:
        lines.extend(['', '| Artifact | Environment | Evidence state | Integrity |', '| --- | --- | --- | --- |'])
        for item in result['evidence']:
            target = os.path.relpath(root / item['path'], output.parent).replace(os.sep, '/')
            label = f"[{md_text(item['artifact'])}]({quote(target, safe='/')})"
            lines.append(f"| {label} | {md_text(item['environment'])} | {md_text(item['status'])} | {md_text(item['integrity'])} |")
    else:
        lines.extend(['', 'No evidence recorded. Browser behavior and release status are unknown.'])
    count = result['counts']
    lines.extend(['', '## Local observation counts', '', f"Human sessions: {count['human_sessions'] if count['human_sessions'] is not None else 'unknown (session IDs missing)'}. Scheduled runs: {count['scheduled_runs']}. Retries: {count['retries']}. Outcome sample: {count['sample_size']}.", '', result['observation_window']['basis'], '', '## Scheduled follow-ups', ''])
    if not result['jobs']:
        lines.append('No job specification recorded. Nothing is scheduled by this plugin.')
    for job in result['jobs']:
        lines.append(f"- {md_text(job['kind'])}: {md_text(job['state'])}; {md_text(job['cadence'])} in {md_text(job['timezone'])}; activation evidence: {md_text(job['activation_integrity'])}. Actual host controls remain separate.")
    lines.extend(['', '## Feedback', '', f"Builder records: {len(result['builder_feedback'])}. Extension records: {len(result['extension_feedback'])}. Identities remain separate.", '', 'The full local report contains project context. Use the dedicated builder feedback sharing export and inspect it before sharing.', '', 'No independent browser verification or Store publication is claimed.'])
    return '\n'.join(lines) + '\n'


def export_report(root, basename, result, *, force=False):
    base = relative_file(root, basename)
    relative = base.relative_to(root)
    if '.extension-builder' in relative.parts or sensitive_file(relative):
        raise ValueError('reports cannot overwrite private state or credential/backend paths')
    outputs = [relative_file(root, basename + suffix) for suffix in ('.json', '.md')]
    for path in outputs:
        if sensitive_file(path.relative_to(root)):
            raise ValueError('final report destination is a protected credential/backend path')
        if path.exists() and (not force or not path.is_file()):
            raise ValueError('report output already exists; choose a new basename or explicitly use --force')
    contents = [json.dumps(result, indent=2, ensure_ascii=False) + '\n', markdown_view(result, root, outputs[1])]
    prepared = []
    try:
        for path, content in zip(outputs, contents):
            path.parent.mkdir(parents=True, exist_ok=True)
            descriptor, name = tempfile.mkstemp(prefix='.report-', dir=path.parent)
            temp = Path(name)
            prepared.append((path, temp))
            with os.fdopen(descriptor, 'w', encoding='utf-8') as stream:
                stream.write(content)
        for path, temp in prepared:
            safe_path(path)
            if force:
                os.replace(temp, path)
            else:
                os.link(temp, path)
                temp.unlink()
    finally:
        for _, temp in prepared:
            temp.unlink(missing_ok=True)
    return {'outputs': [p.relative_to(root).as_posix() for p in outputs], 'sha256': {p.relative_to(root).as_posix(): hashlib.sha256(p.read_bytes()).hexdigest() for p in outputs}, 'uploaded': False}
