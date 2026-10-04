"""Synthetic, editable input shapes. They are not real observations or usage data."""
EXAMPLES = {
    'context': {
        'goal': 'Keep selected research snippets available without losing the current page',
        'audience': 'People collecting notes during research',
        'acceptance_journey': ['Select a snippet on an approved site', 'Save a draft locally', 'Reopen the extension and recover the draft'],
        'constraints': ['No credentials in the extension bundle', 'Offline draft persistence'],
        'current_task': 'Inspect the page and storage boundaries',
        'next_action': 'Choose the first acceptance case to reproduce',
        'provenance': {'goal': {'confidence': 'provisional', 'source': 'synthetic example; replace with authorized project evidence', 'scope': 'example first slice'}},
    },
    'decision': {'id': 'example-surface', 'key': 'surface', 'value': 'side-panel', 'confidence': 'provisional', 'source': 'synthetic starting assumption; replace with the real basis', 'scope': 'first slice', 'evidence_ids': []},
    'evidence': {'id': 'example-qa', 'path': 'reports/runtime-observation.md', 'artifact': 'exact build identifier to record', 'environment': 'actual checked browser/version/profile to record', 'category': 'runtime-test', 'status': 'not-run'},
    'feedback': {'id': 'example-feedback', 'product': 'builder', 'package_version': '2.3.0', 'host': 'Codex', 'task_category': 'continue', 'outcome': 'partly-useful', 'issue_category': 'feature-request', 'note': 'Synthetic example. Replace with a voluntarily supplied sanitized observation.'},
    'outcome': {'id': 'example-local-outcome', 'origin': 'human', 'intent': 'continue', 'outcome': 'unrun', 'summary': 'Synthetic input shape. Replace with the actual task outcome.', 'changed': [], 'can_do_now': [], 'blocked': ['No real evaluation has been recorded'], 'next_action': 'Run the authorized acceptance case', 'evidence_ids': []},
    'job': {'id': 'example-compatibility', 'kind': 'compatibility', 'source_identifier': 'explicitly approved Chrome documentation and project dependencies', 'timezone': 'Asia/Karachi', 'cadence': 'User-chosen Mondays at 09:00', 'context_pointer': '.extension-builder/project.json', 'allowed_actions': ['inspect', 'report'], 'allowed_tools': ['public-documentation', 'project-files'], 'budget_minutes': 10, 'notification': 'actionable'},
    'activation': {'host': 'chosen-supported-host', 'scheduler_reference': 'replace-with-host-schedule-id', 'activation_evidence': 'reports/host-activation-evidence.md'},
}
