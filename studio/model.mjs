/** Pure local planning transforms: no filesystem, environment or network access.
 * Inputs are explicitly supplied plans. Security examples below describe rejected
 * designs, not executable credential handling. Completion is never release proof.
 */
export const VERSION = 2;
export const MAX_SESSION_BYTES = 1048576;
export const STEPS = [
  { id: 'research', label: 'Research', subtitle: 'Find the useful edge', checks: ['Interview or observe target users', 'Compare current alternatives with sources', 'Write one measurable user outcome'] },
  { id: 'architecture', label: 'Architecture', subtitle: 'Make boundaries explicit', checks: ['Map extension, page, and server trust boundaries', 'Justify each permission and exact host', 'Plan persistence, retries, and worker restarts'] },
  { id: 'design', label: 'Experience', subtitle: 'Make every state feel considered', checks: ['Choose surfaces around the user task', 'Design loading, empty, error, and signed-out states', 'Review keyboard use, contrast, and reduced motion'] },
  { id: 'build', label: 'Build', subtitle: 'Ship a coherent vertical slice', checks: ['Build the smallest end-to-end user journey', 'Validate messages and isolate page content', 'Keep secrets and privileged logic on the server'] },
  { id: 'test', label: 'Validate', subtitle: 'Replace assumptions with evidence', checks: ['Test the exact built artifact in Chrome', 'Exercise offline, denied permissions, and worker restarts', 'Record security and accessibility findings'] },
  { id: 'release', label: 'Release', subtitle: 'Prepare an honest submission', checks: ['Match disclosures and privacy policy to actual behavior', 'Package only the reviewed artifact', 'Record submission and live listing separately'] }
];
export const PERMISSIONS = ['storage', 'activeTab', 'scripting', 'alarms', 'notifications', 'tabs'];
export const TEAM = [
  ['Research lead', 'Evidence, competitors, user jobs, and scope'],
  ['Extension architect', 'MV3 lifecycle, trust boundaries, permissions'],
  ['Experience designer', 'Surfaces, visual system, states, accessibility'],
  ['Frontend engineer', 'Popup, side panel, options, page integration'],
  ['Backend engineer', 'APIs, identity, entitlements, jobs, data lifecycle'],
  ['Integration engineer', 'Provider contracts, scoped adapters, recovery'],
  ['Security reviewer', 'Messages, authorization, secrets, dependencies'],
  ['Quality engineer', 'Built-artifact journeys and failure recovery'],
  ['Performance engineer', 'Measured responsiveness, resource use, cost'],
  ['Release lead', 'Package, disclosures, store assets, support'],
  ['Maintenance engineer', 'Incidents, updates, migrations, regression checks'],
  ['Independent evaluator', 'Hard gates, evidence-based ranking, bounded refinement']
];
export const VIEWS = [
  { id: 'overview', label: 'Overview', subtitle: 'Your next useful step.' },
  { id: 'experience', label: 'Experience', subtitle: 'An experience worth using.' },
  { id: 'architecture', label: 'Architecture', subtitle: 'Build with intention.' },
  { id: 'quality', label: 'Quality', subtitle: 'Evidence you can inspect.' },
  { id: 'feedback', label: 'Feedback', subtitle: 'Make useful work better.' },
  { id: 'activity', label: 'Activity', subtitle: 'Continue with context.' },
  { id: 'release', label: 'Release', subtitle: 'A release, truthfully prepared.' }
];
export const RUBRIC = { task_success: 25, security_privacy: 20, usability_accessibility: 20, architecture_reliability: 15, test_evidence: 10, performance_cost: 10 };
export const ROUND_WEIGHTS = [RUBRIC, RUBRIC, RUBRIC];
export const CONTEXT_FIELDS = ['goal', 'audience', 'acceptance_journey', 'constraints', 'current_task', 'next_action'];
export const INTENTS = ['build', 'improve', 'fix', 'audit', 'prepare-release', 'continue'];
export const FEEDBACK_CATEGORIES = ['reproducible-defect', 'confusing-experience', 'context-failure', 'inaccurate-claim', 'feature-request'];
export const CANDIDATES = [
  { id: 'focused', name: 'Focused local utility', type: 'local', surface: 'popup', backend: 'none', permissions: ['storage'], scores: { safety: 5, simplicity: 5, usability: 4, resilience: 5 }, detail: 'A compact popup with durable local state. Smallest operational footprint.' },
  { id: 'companion', name: 'Connected side panel', type: 'cloud', surface: 'sidepanel', backend: 'existing', permissions: ['storage', 'activeTab'], scores: { safety: 4, simplicity: 3, usability: 5, resilience: 4 }, detail: 'A persistent task surface connected to an authenticated API. Add explicit offline and sign-in states.' },
  { id: 'hybrid', name: 'Offline-first workspace', type: 'hybrid', surface: 'sidepanel', backend: 'new', permissions: ['storage'], scores: { safety: 4, simplicity: 2, usability: 5, resilience: 5 }, detail: 'Local-first drafts with optional cloud sync. Requires conflict handling, deletion, and account boundaries.' },
  { id: 'unsafe', name: 'Broad access + client secret', type: 'cloud', surface: 'popup', backend: 'new', permissions: ['tabs'], scores: { safety: 1, simplicity: 3, usability: 3, resilience: 2 }, rejected: true, detail: 'Rejected: unnecessary broad page access and a privileged secret in distributable client code.' }
];
export function defaultSession(workspaceId = 'local-plan') {
  return { version: VERSION, workspace_id: workspaceId, project: { name: 'My useful extension', purpose: '', type: 'local', surface: 'popup', permissions: ['storage'], domains: '', backend: 'none' }, view: 'overview', step: 'research', checks: Object.fromEntries(STEPS.map(s => [s.id, s.checks.map(() => false)])), staleChecks: Object.fromEntries(STEPS.map(s => [s.id, s.checks.map(() => false)])), staleStages: [], staleEvidence: [], candidate: 'focused', generation: 0, context: Object.fromEntries(CONTEXT_FIELDS.map(k => [k, ['acceptance_journey', 'constraints'].includes(k) ? [] : ''])), report: null, ratings: [], outcomes: [], feedback: [], activity: [] };
}
const plain = v => Boolean(v && typeof v === 'object' && !Array.isArray(v) && Object.getPrototypeOf(v) === Object.prototype);
function exactKeys(value, allowed, label) { for (const key of Object.keys(value)) if (!allowed.includes(key)) throw new Error(`Unexpected ${label} field: ${key}`); }
function boundedText(value, max, label) { if (typeof value !== 'string' || value.length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value)) throw new Error(`${label} must be text under ${max} characters without control characters.`); if (/(?:-----BEGIN [A-Z ]*PRIVATE KEY-----|\b(?:sk-[A-Za-z0-9_-]{10,}|gh[pousr]_[A-Za-z0-9]{10,}|AKIA[A-Z0-9]{16}|xox[baprs]-[A-Za-z0-9-]{10,})|\b(?:api[_ -]?key|password|access[_ -]?token|refresh[_ -]?token|authorization)\s*[:=]\s*\S+|\bBearer\s+\S+|https?:\/\/[^\s/]+:[^\s/]+@)/i.test(value)) throw new Error(`${label} appears to contain credential data. Use a sanitized placeholder.`); return value; }
function choice(value, allowed, label) { if (!allowed.includes(value)) throw new Error(`Invalid ${label}.`); return value; }
function parseLegacy(raw) {
  if (typeof raw !== 'string' || new TextEncoder().encode(raw).length > MAX_SESSION_BYTES) throw new Error('Session exceeds the 1 MiB import limit.');
  let input;
  try { input = JSON.parse(raw); } catch { throw new Error('Choose a valid JSON session file.'); }
  if (!plain(input) || !plain(input.project) || !plain(input.checks)) throw new Error('Session structure is invalid.');
  exactKeys(input, ['version', 'project', 'step', 'checks', 'candidate', 'generation'], 'session');
  exactKeys(input.project, ['name', 'purpose', 'type', 'surface', 'permissions', 'domains', 'backend'], 'project');
  exactKeys(input.checks, STEPS.map(s => s.id), 'checklist');
  if (input.version !== 1) throw new Error('Unsupported session version.');
  const p = input.project;
  if (!Array.isArray(p.permissions) || p.permissions.length > PERMISSIONS.length || new Set(p.permissions).size !== p.permissions.length || p.permissions.some(x => !PERMISSIONS.includes(x))) throw new Error('Invalid permissions.');
  const checks = Object.fromEntries(STEPS.map(s => { const values = input.checks[s.id]; if (!Array.isArray(values) || values.length !== s.checks.length || values.some(v => typeof v !== 'boolean')) throw new Error(`Invalid ${s.label} checklist.`); return [s.id, [...values]]; }));
  if (!Number.isInteger(input.generation) || input.generation < 0 || input.generation > 2) throw new Error('Candidate rounds must be between 0 and 2.');
  return { version: VERSION, project: { name: boundedText(p.name, 75, 'Name'), purpose: boundedText(p.purpose, 132, 'Purpose'), type: choice(p.type, ['local', 'cloud', 'hybrid'], 'product type'), surface: choice(p.surface, ['popup', 'sidepanel'], 'surface'), permissions: [...p.permissions], domains: boundedText(p.domains, 1000, 'Domains'), backend: choice(p.backend, ['none', 'existing', 'new'], 'backend') }, step: choice(input.step, STEPS.map(s => s.id), 'step'), checks, candidate: choice(input.candidate, CANDIDATES.filter(c => !c.rejected).map(c => c.id), 'candidate'), generation: input.generation };
}
export function issues(session) {
  const p = session.project; const result = [];
  if (!p.name.trim()) result.push('Add a project name.');
  if (!p.purpose.trim()) result.push('Describe one clear user purpose.');
  if (p.purpose.trim().length > 132) result.push('Keep the single purpose within Chrome’s 132-character description limit.');
  if (p.name.trim().length > 75) result.push('Keep the name within 75 characters.');
  if (p.name.trim() && !/[a-z0-9]/i.test(p.name)) result.push('Include at least one Latin letter or number for the scaffold folder name.');
  if (p.type !== 'local' && p.backend === 'none') result.push('Choose an API plan for this connected product.');
  if (p.type === 'local' && p.backend !== 'none') result.push('A local product should not require a server; choose cloud or hybrid if needed.');
  const hosts = p.domains.split(/[,\n]/).map(x => x.trim()).filter(Boolean);
  if (hosts.some(x => !/^https:\/\/[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?(?::\d{1,5})?\/\*$/.test(x))) result.push('Use exact HTTPS host patterns, such as https://example.com/*. Wildcard hosts are not allowed here.');
  if (p.permissions.includes('scripting') && !p.permissions.includes('activeTab') && hosts.length === 0) result.push('Scripting needs a deliberate activeTab or exact-host access plan.');
  if (p.permissions.includes('tabs')) result.push('Explain why sensitive tab metadata is essential; activeTab may be sufficient.');
  return result;
}
export function progress(session) {
  const complete = STEPS.reduce((n, s) => n + session.checks[s.id].filter((v, i) => v && !session.staleChecks[s.id][i]).length, 0);
  const stale = Object.values(session.staleChecks).flat().filter(Boolean).length;
  return { complete, stale, total: 18, percent: Math.round(complete / 18 * 100) };
}
export function rankCandidates(session) {
  return CANDIDATES.map(c => {
    const metrics = Object.keys(RUBRIC).map(dimension => session.ratings.find(r => r.candidate === c.id && r.dimension === dimension) || { dimension, kind: 'unknown', value: null });
    const allMeasured = metrics.every(r => r.kind === 'measured');
    const score = allMeasured ? Math.round(metrics.reduce((sum, r) => sum + r.value / 5 * RUBRIC[r.dimension], 0)) : null;
    return { ...c, metrics, score, fit: c.type === session.project.type ? 1 : 0 };
  }).sort((a, b) => Number(Boolean(a.rejected)) - Number(Boolean(b.rejected)) || b.fit - a.fit || (b.score ?? -1) - (a.score ?? -1));
}
export function candidateDiff(session, id) {
  const c = CANDIDATES.find(c => c.id === id);
  if (!c || c.rejected) throw new Error('This candidate failed the safety gate.');
  return ['type', 'surface', 'backend', 'permissions'].filter(key => JSON.stringify(session.project[key]) !== JSON.stringify(c[key])).map(key => ({ field: key, before: session.project[key], after: c[key] }));
}
export function applyCandidate(session, id, timestamp = '') {
  const candidate = CANDIDATES.find(c => c.id === id);
  if (!candidate || candidate.rejected) throw new Error('This candidate failed the safety gate.');
  return { ...changeProject(session, Object.fromEntries(['type', 'surface', 'backend', 'permissions'].map(k => [k, candidate[k]])), timestamp), candidate: id };
}
export function evolve(session, timestamp = '') {
  if (session.generation >= 2) throw new Error('Three comparison rounds are complete. Record evidence before starting another cycle.');
  return addActivity({ ...session, generation: session.generation + 1 }, 'comparison', 'Comparison round recorded. Stable rubric and existing evidence retained; no improvement inferred.', timestamp);
}
export function shellQuote(value) { return `'${String(value).replaceAll("'", "'\\''")}'`; }
export function scaffoldCommand(session) {
  const p = session.project;
  const output = p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50) || 'my-extension';
  return `node skills/chrome-extension-builder/scripts/extension_builder.mjs scaffold --name=${shellQuote(p.name)} --purpose=${shellQuote(p.purpose)} --output=${shellQuote(`./${output}`)} --${p.surface === 'popup' ? 'popup' : 'side-panel'} --service-worker`;
}
export function briefMarkdown(session) {
  const p = session.project; const state = progress(session); const next = nextWork(session);
  const text = value => String(value).replaceAll('\r', '').replaceAll('\n', ' ').replace(/[<>]/g, '').replace(/[\\`*_{}\[\]()#!|]/g, '\\$&');
  const command = scaffoldCommand(session);
  const fence = '`'.repeat(Math.max(3, ...[...command.matchAll(/`+/g)].map(m => m[0].length + 1)));
  const lines = [`# ${text(p.name)}`, '', '## Next task', '', `${text(next.title)} via ${text(next.skill)}.`, text(next.action), ...next.blockers.map(b => `- ${text(b)}`), 'Planning recommendation only; reconcile current files and authority before executing.', '', `Single purpose: ${text(p.purpose) || 'To define'}`, '', `Product: ${p.type} | Surface: ${p.surface} | Backend: ${p.backend}`, `Permissions to justify: ${p.permissions.join(', ') || 'none'}`, `Exact hosts to review: ${text(p.domains) || 'none declared'}`, '', '## Data boundaries', '', p.type === 'local' ? 'Page data → validated extension messages → local storage. No cloud transfer planned.' : 'Page data → validated extension messages → authenticated API → authorized account storage. Add retention, deletion, consent, retries, and offline behavior.', 'Privileged secrets remain on the server. Page content and messages are untrusted.', '', '## Scaffold command', '', 'Run from the plugin source folder with Node and Python available. The scaffold is a starter; selected permissions, host access, and cloud services still need implementation.', '', `${fence}sh`, command, fence, '', '## Declared workflow progress', '', `${state.complete}/${state.total} current declarations; ${state.stale} stale declarations. This is not verified runtime, deployment, or store evidence.`, ''];
  for (const s of STEPS) { lines.push(`### ${s.label}`, ...s.checks.map((c, i) => `- [${session.checks[s.id][i] && !session.staleChecks[s.id][i] ? 'x' : ' '}] ${c}${session.staleChecks[s.id][i] ? ' (stale after a requirement change)' : ''}`), ''); }
  lines.push('## Verification states', '', '- Local plan: editable in this workbench', '- Built artifact: unverified', '- Chrome runtime behavior: unverified', '- Backend deployment: unverified', '- Store submission: unverified', '- Public listing: unverified', '', '## Specialist team', '', ...TEAM.map(([name, responsibility]) => `- ${name}: ${responsibility}`), '');
  lines.push('## Scoped context', '', ...CONTEXT_FIELDS.map(key => `- ${text(key.replaceAll('_', ' '))}: ${text(session.context[key]) || 'Not recorded'}`), '', session.report ? `Imported canonical project: ${text(session.report.project.project_id)}. Source report generated ${text(session.report.generated_at)}. Referenced files were not inspected by Studio.` : 'No canonical project report imported. Local context remains a draft.', '', '## Evidence records', '', ...evidenceRows(session).map(e => `- ${text(e.category)}: ${text(e.effective_status)}; originally recorded ${text(e.recorded_status)}. Artifact ${text(e.artifact)}; environment ${text(e.environment)}; date ${text(e.recorded_at)}; source ${text(e.path)}. ${text(e.freshness)}.`), '', '## Session recaps', '', ...[...(session.report?.outcomes || []), ...session.outcomes].map(o => `- ${text(o.origin)} / ${text(o.outcome)}: ${text(o.summary)}. Next: ${text(o.next_action) || 'Not recorded'}.`), '', 'This handoff is a local review artifact, not live browser, scheduler, deployment, or store proof.');
  return lines.join('\n');
}

function list(value, max, label) { if (!Array.isArray(value) || value.length > max) throw new Error(`Invalid ${label}; maximum ${max} records.`); return value; }
function nonempty(value, max, label) { const s = boundedText(value, max, label); if (!s.trim()) throw new Error(`${label} is required.`); return s; }
function identifier(value, label) { const s = nonempty(value, 100, label); if (!/^[a-zA-Z0-9][a-zA-Z0-9_.:-]*$/.test(s)) throw new Error(`Invalid ${label}.`); return s; }
function timestamp(value, label, optional = false) { if (optional && value === '') return ''; if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})$/.test(value) || !Number.isFinite(Date.parse(value))) throw new Error(`Invalid ${label}; use an ISO timestamp with timezone.`); return value; }
function relativePath(value) { const p = nonempty(value, 500, 'Evidence path'); if (/^(?:\/|[a-zA-Z]:)|[\\\u0000]/.test(p) || p.split('/').some(x => x === '..' || x === '.' || !x) || p.includes('://')) throw new Error('Evidence paths must stay relative to the authorized project.'); return p; }
function boolChecks(value, label) { if (!plain(value)) throw new Error(`Invalid ${label}.`); exactKeys(value, STEPS.map(s => s.id), label); return Object.fromEntries(STEPS.map(s => [s.id, list(value[s.id], 3, label).map(v => { if (typeof v !== 'boolean') throw new Error(`Invalid ${label}.`); return v; })])); }
function contextValue(value) { if (!plain(value)) throw new Error('Invalid project context.'); exactKeys(value, CONTEXT_FIELDS, 'context'); return Object.fromEntries(CONTEXT_FIELDS.map(key => [key, ['acceptance_journey', 'constraints'].includes(key) ? list(value[key] ?? [], 100, key).map(v => nonempty(v, 1000, key)) : boundedText(value[key] ?? '', 2000, key)])); }
export function contextPatch(context) { const valid = contextValue(context); const patch = Object.fromEntries(Object.entries(valid).filter(([, value]) => Array.isArray(value) ? value.length > 0 : Boolean(value.trim()))); if (!Object.keys(patch).length) throw new Error('Add at least one populated context field before exporting a patch.'); return patch; }
/** Route supplied task records without executing their text. */
export function nextWork(session) {
  const action = session.context.next_action.trim() || session.context.current_task.trim() || session.outcomes.at(-1)?.next_action || session.report?.next_action || '';
  const task = `${session.context.current_task} ${action}`.toLowerCase();
  const conflicts = session.report?.conflicts || [];
  const blockers = [...conflicts.map(c => `Resolve the recorded ${c.key} decision conflict.`), ...session.staleEvidence.map(() => 'Affected evidence is stale; verify the current artifact.')];
  let intent, view, title, skill;
  if (conflicts.length) [intent, view, title, skill] = ['resolve-context', 'overview', 'Resolve decisions', 'context'];
  else if (/\b(fix|bug|broken|crash|debug|repair|failure|disappearing)\b/.test(task)) [intent, view, title, skill] = ['fix', 'quality', 'Continue debugging', 'debugging'];
  else if (/\b(package|zip|publish|release|store listing)\b/.test(task)) [intent, view, title, skill] = ['prepare-release', 'release', 'Continue release preparation', 'prepare-release'];
  else if (/\b(audit|review|security|permissions)\b/.test(task)) [intent, view, title, skill] = ['audit', 'quality', 'Continue review', 'audit'];
  else if (/\b(test|verify|verification|validate)\b/.test(task) || session.staleEvidence.length) [intent, view, title, skill] = ['test', 'quality', 'Continue verification', 'testing'];
  else if (/\b(popup|layout|design|polish|accessibility|onboarding)\b/.test(task)) [intent, view, title, skill] = ['improve', 'experience', 'Continue the experience', 'ux-design'];
  else if (/\b(import|restore|resume)\b/.test(task)) [intent, view, title, skill] = ['continue', 'overview', 'Reconcile project context', 'context'];
  else {
    const stage = session.report ? STEPS.find(s => session.report.stages?.[s.id]?.status !== 'evidenced')?.id || 'release' : session.step;
    view = { research: 'overview', architecture: 'architecture', design: 'experience', build: 'architecture', test: 'quality', release: 'release' }[stage];
    [intent, title, skill] = stage === 'test' ? ['test', 'Continue verification', 'testing'] : stage === 'release' ? ['prepare-release', 'Continue release preparation', 'prepare-release'] : stage === 'design' ? ['improve', 'Continue the experience', 'ux-design'] : ['build', 'Continue the useful feature', 'build'];
  }
  return { intent, view, title, skill: `chrome-extension-builder-${skill}`, action: conflicts.length ? blockers[0] : action || 'Inspect the current project and deliver one useful feature with acceptance evidence.', blockers, basis: task.trim() ? 'supplied task and next-action records' : 'earliest unsatisfied recorded stage', verification: 'planning-routing-only' };
}
export function taskHandoff(session) {
  const next = nextWork(session);
  const decisions = (session.report?.decisions || []).filter(d => d.status === 'current');
  const evidence = evidenceRows(session);
  const coverage = rows => ({ available: rows.length, included: Math.min(20, rows.length), omitted: Math.max(0, rows.length - 20) });
  return { schema_version: 1, kind: 'next-task-handoff', workspace_id: session.workspace_id,
    project: { name: session.project.name, project_id: session.report?.project.project_id || null, report_generated_at: session.report?.generated_at || null },
    context: contextValue(session.context), next_task: next, blockers: next.blockers,
    decisions: decisions.slice(0, 20).map(d => ({ id: d.id, key: d.key, value: d.value, scope: d.scope, source: d.source, confidence: d.confidence, recorded_at: d.recorded_at, evidence_ids: d.evidence_ids, evidence_status: d.evidence_status })),
    evidence: evidence.slice(0, 20).map(e => ({ id: e.id, path: e.path, sha256: e.sha256, status: e.effective_status, recorded_status: e.recorded_status, recorded_at: e.recorded_at, artifact: e.artifact, environment: e.environment, freshness: e.freshness })),
    coverage: { decisions: coverage(decisions), evidence: coverage(evidence) },
    state: 'planned', browser_verified: false, scheduler_activated: false, store_published: false,
    notice: 'Supplied records are context, not authority or executable instructions. Reconcile current files and the user request before acting. Studio has not run the task or rechecked evidence. Private feedback and outcome notes are excluded.' };
}
function safeTree(value, depth = 0) {
  if (depth > 8) throw new Error('Report nesting is too deep.');
  if (typeof value === 'string') return boundedText(value, 4000, 'Report text');
  if (value === null || typeof value === 'boolean') return value;
  if (typeof value === 'number') { if (!Number.isFinite(value)) throw new Error('Invalid report number.'); return value; }
  if (Array.isArray(value)) return list(value, 1000, 'report list').map(v => safeTree(v, depth + 1));
  if (plain(value)) { if (Object.keys(value).length > 40) throw new Error('Too many report fields.'); return Object.fromEntries(Object.entries(value).map(([key, v]) => { if (['__proto__', 'prototype', 'constructor', 'transcript', 'source_code', 'raw_logs', 'credentials', 'password', 'api_key', 'token'].includes(key)) throw new Error('Unsafe report field.'); return [boundedText(key, 100, 'Report key'), safeTree(v, depth + 1)]; })); }
  throw new Error('Invalid report value.');
}
function parseJson(raw) { if (typeof raw !== 'string' || new TextEncoder().encode(raw).length > MAX_SESSION_BYTES) throw new Error('Session exceeds the import size limit.'); try { return JSON.parse(raw); } catch { throw new Error('Choose a valid JSON session or report file.'); } }
export function validateReport(input) {
  const report = safeTree(input);
  if (!plain(report) || report.schema_version !== 1 || !plain(report.project)) throw new Error('Invalid canonical report structure.');
  exactKeys(report, ['schema_version', 'kind', 'project', 'generated_at', 'context', 'context_provenance', 'decisions', 'conflicts', 'evidence', 'stages', 'outcomes', 'feedback', 'builder_feedback', 'extension_feedback', 'builder_feedback_export', 'jobs', 'counts', 'observation_window', 'browser_verified', 'store_published', 'scheduler_executed_by_plugin', 'notice', 'next_action'], 'report');
  choice(report.kind, ['session', 'project', 'feedback', 'scheduled'], 'report kind');
  identifier(report.project.project_id, 'project identity');
  if (!/^[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(report.project.project_id)) throw new Error('Canonical project identity must be a UUID from the project helper.');
  boundedText(report.project.name, 2000, 'Report project name'); choice(report.project.mode, ['local', 'cloud', 'hybrid'], 'report product mode');
  timestamp(report.generated_at, 'Report generation date'); report.context = contextValue(report.context);
  if (report.browser_verified !== false || report.store_published !== false) throw new Error('The tracker cannot establish browser verification or store publication.');
  boundedText(report.notice, 4000, 'Report notice');
  const decisions = list(report.decisions, 1000, 'decisions');
  for (const d of decisions) { if (!plain(d)) throw new Error('Invalid decision.'); identifier(d.id, 'decision id'); nonempty(d.key, 100, 'Decision key'); boundedText(d.value, 2000, 'Decision value'); choice(d.confidence, ['confirmed', 'observed', 'provisional'], 'decision confidence'); nonempty(d.source, 2000, 'Decision source'); nonempty(d.scope, 2000, 'Decision scope'); timestamp(d.recorded_at, 'Decision date'); choice(d.status, ['current', 'conflict', 'superseded'], 'decision status'); list(d.evidence_ids, 100, 'decision evidence').forEach(id => identifier(id, 'evidence id')); }
  const evidence = list(report.evidence, 1000, 'evidence');
  for (const e of evidence) { if (!plain(e)) throw new Error('Invalid evidence.'); identifier(e.id, 'evidence id'); relativePath(e.path); if (!/^[a-f0-9]{64}$/i.test(e.sha256)) throw new Error('Invalid evidence checksum.'); nonempty(e.artifact, 2000, 'Artifact identity'); nonempty(e.environment, 2000, 'Evidence environment'); nonempty(e.category, 100, 'Evidence category'); choice(e.status, ['verified', 'failed', 'not-run', 'not-applicable', 'stale'], 'evidence status');
    choice(e.recorded_status, ['verified', 'failed', 'not-run', 'not-applicable'], 'recorded evidence status'); choice(e.integrity, ['current', 'changed-or-unavailable'], 'evidence integrity'); timestamp(e.recorded_at, 'Evidence date'); }
  if (new Set(evidence.map(e => e.id)).size !== evidence.length || new Set(decisions.map(d => d.id)).size !== decisions.length) throw new Error('Duplicate report record identity.');
  if (!plain(report.stages)) throw new Error('Invalid report stages.'); exactKeys(report.stages, STEPS.map(s => s.id), 'stage');
  for (const step of STEPS) { const stage = report.stages[step.id]; if (!plain(stage)) throw new Error('Invalid report stage.'); choice(stage.status, ['pending', 'evidenced', 'stale', 'not-applicable'], 'stage status'); if (stage.evidence !== undefined) relativePath(stage.evidence); }
  list(report.outcomes, 1000, 'outcomes').forEach(validateOutcome);
  if (!plain(report.counts)) throw new Error('Invalid report counts.');
  const actual = outcomeCounts(report.outcomes);
  for (const key of Object.keys(actual)) { const n = report.counts[key]; if (key === 'human_sessions' && n === null) continue; if (!Number.isInteger(n) || n < 0) throw new Error('Invalid report observation count.'); if (['project', 'feedback'].includes(report.kind) && n !== actual[key]) throw new Error('Full project counts must match supplied outcomes.'); }
  if (report.counts.sample_size < report.outcomes.length) throw new Error('Outcome sample cannot be smaller than the supplied records.');
  if (report.scheduler_executed_by_plugin !== false) throw new Error('A local report cannot establish plugin scheduler execution.');
  if (!plain(report.observation_window)) throw new Error('Invalid observation window.');
  for (const key of ['start', 'end']) if (report.observation_window[key] !== null) timestamp(report.observation_window[key], 'Observation window');
  if (!plain(report.context_provenance)) throw new Error('Invalid context provenance.');
  for (const [key, p] of Object.entries(report.context_provenance)) { choice(key, CONTEXT_FIELDS, 'context field'); if (!plain(p)) throw new Error('Invalid context source.'); choice(p.confidence, ['confirmed', 'observed', 'provisional'], 'context confidence'); nonempty(p.source, 2000, 'Context source'); nonempty(p.scope, 2000, 'Context scope'); list(p.evidence_ids, 100, 'context evidence').forEach(id => identifier(id, 'context evidence id'));  timestamp(p.recorded_at, 'Context date'); }
  for (const key of ['feedback', 'builder_feedback', 'extension_feedback']) if (report[key] !== undefined) list(report[key], 1000, 'report feedback').forEach(validateFeedback);
  if (report.conflicts !== undefined) for (const conflict of list(report.conflicts, 1000, 'report conflicts')) { if (!plain(conflict)) throw new Error('Invalid decision conflict.'); nonempty(conflict.key, 100, 'Conflict key'); nonempty(conflict.scope, 2000, 'Conflict scope'); list(conflict.decision_ids, 1000, 'conflicting decisions').forEach(id => identifier(id, 'conflicting decision id')); }
  if (report.jobs !== undefined) for (const job of list(report.jobs, 1000, 'report jobs')) { if (!plain(job)) throw new Error('Invalid job record.'); identifier(job.id, 'job id'); for (const key of ['kind', 'state', 'cadence', 'timezone', 'source_identifier', 'context_pointer']) boundedText(job[key], 2000, `Job ${key}`); }
  return report;
}
export function parseReport(raw) { return validateReport(parseJson(raw)); }
export function parseSession(raw) {
  const input = parseJson(raw);
  if (input?.version === 1) { const legacy = parseLegacy(raw); return { ...defaultSession(), ...legacy, version: VERSION }; }
  if (!plain(input) || input.version !== VERSION) throw new Error('Unsupported session version.');
  exactKeys(input, Object.keys(defaultSession()), 'session');
  const legacy = parseLegacy(JSON.stringify({ version: 1, project: input.project, step: input.step, checks: input.checks, candidate: input.candidate, generation: input.generation }));
  const result = { ...defaultSession(), ...legacy, version: VERSION, workspace_id: identifier(input.workspace_id, 'workspace identity'), view: choice(input.view, VIEWS.map(v => v.id), 'view'), staleChecks: boolChecks(input.staleChecks, 'stale checklist'), context: contextValue(input.context), report: input.report === null ? null : validateReport(input.report), staleStages: list(input.staleStages, 6, 'stale stages').map(s => choice(s, STEPS.map(s => s.id), 'stale stage')), staleEvidence: list(input.staleEvidence, 1000, 'stale evidence').map(id => identifier(id, 'evidence id')), ratings: list(input.ratings, 24, 'ratings').map(validateRating), outcomes: list(input.outcomes, 100, 'outcomes').map(validateOutcome), feedback: list(input.feedback, 100, 'feedback').map(validateFeedback), activity: list(input.activity, 100, 'activity').map(a => { if (!plain(a)) throw new Error('Invalid activity.'); exactKeys(a, ['id', 'type', 'summary', 'recorded_at'], 'activity'); return { id: identifier(a.id, 'activity id'), type: boundedText(a.type, 100, 'Activity type'), summary: boundedText(a.summary, 1000, 'Activity summary'), recorded_at: timestamp(a.recorded_at, 'Activity date', true) }; }) };
  for (const s of STEPS) { if (result.staleChecks[s.id].length !== 3) throw new Error('Invalid stale checklist length.'); }
  if (result.staleEvidence.some(id => !result.report?.evidence.some(e => e.id === id))) throw new Error('Stale evidence must reference the imported project report.');
  return result;
}
export function addActivity(session, type, summary, at = '') { const next = { id: `change-${session.activity.length}-${session.generation}`, type, summary, recorded_at: at }; return { ...session, activity: [...session.activity, next].slice(-100) }; }
function affectedStages(fields) { const indices = fields.map(field => field === 'purpose' || ['goal', 'audience', 'acceptance_journey', 'constraints'].includes(field) ? 0 : ['surface', 'name'].includes(field) ? 2 : ['type', 'backend', 'domains', 'permissions'].includes(field) ? 1 : 6); return STEPS.slice(Math.min(...indices, 6)).map(s => s.id); }
function staleAfter(session, fields) {
  const affected = affectedStages(fields);
  if (!affected.length) return session;
  const staleChecks = Object.fromEntries(STEPS.map(s => [s.id, session.staleChecks[s.id].map((v, i) => v || (affected.includes(s.id) && session.checks[s.id][i]))]));
  return { ...session, ratings: [], staleChecks, staleStages: [...new Set([...session.staleStages, ...affected])], staleEvidence: [...new Set([...session.staleEvidence, ...(session.report?.evidence || []).filter(e => affected.includes(categoryStage(e.category))).map(e => e.id)])] };
}
export function categoryStage(category) { const c = String(category).toLowerCase(); if (/release|store|listing|submission|package|distribution/.test(c)) return 'release'; if (/browser|runtime|test|quality|security|performance|accessibility/.test(c)) return 'test'; if (/research|user/.test(c)) return 'research'; if (/design|experience|screenshot/.test(c)) return 'design'; if (/build|implementation|frontend|backend/.test(c)) return 'build'; return 'architecture'; }
export function changeProject(session, patch, at = '') { exactKeys(patch, Object.keys(session.project), 'project change'); const changed = Object.keys(patch).filter(k => JSON.stringify(patch[k]) !== JSON.stringify(session.project[k])); if (!changed.length) return session; const merged = { ...session.project, ...patch };
  parseLegacy(JSON.stringify({ version: 1, project: merged, step: session.step, checks: session.checks, candidate: session.candidate, generation: session.generation }));
  const next = staleAfter({ ...session, project: merged }, changed); return at ? addActivity(next, 'project-change', `Changed ${changed.join(', ')}; affected declarations and evidence require review.`, at) : next; }
export function changeContext(session, patch, at = '') { exactKeys(patch, CONTEXT_FIELDS, 'context change'); const changed = Object.keys(patch).filter(k => JSON.stringify(patch[k]) !== JSON.stringify(session.context[k])); const next = staleAfter({ ...session, context: contextValue({ ...session.context, ...patch }) }, changed); return at && changed.length ? addActivity(next, 'context-change', `Updated scoped context: ${changed.join(', ')}.`, at) : next; }
export function declareCheck(session, stage, index, checked) { choice(stage, STEPS.map(s => s.id), 'stage'); if (!Number.isInteger(index) || index < 0 || index > 2 || typeof checked !== 'boolean') throw new Error('Invalid declaration.'); return { ...session, checks: { ...session.checks, [stage]: session.checks[stage].map((v, i) => i === index ? checked : v) }, staleChecks: { ...session.staleChecks, [stage]: session.staleChecks[stage].map((v, i) => i === index ? false : v) } }; }
export function importReport(session, report, { replace = false, at = '' } = {}) {
  const valid = validateReport(report);
  if (session.report && session.report.project.project_id !== valid.project.project_id && !replace) throw new Error('Project identity differs. Explicitly replace this workspace to import a different project.');
  let next = replace ? defaultSession(valid.project.project_id) : session;
  next = changeProject(next, { name: valid.project.name.slice(0, 75), type: valid.project.mode });
  next = changeContext(next, valid.context);
  const sameProject = !replace && session.report?.project.project_id === valid.project.project_id;
  const invalidStages = sameProject ? next.staleStages : [];
  const staleEvidence = sameProject ? valid.evidence.filter(e => invalidStages.includes(categoryStage(e.category)) || next.staleEvidence.includes(e.id)).map(e => e.id) : [];
  next = { ...next, report: valid, context: { ...valid.context }, staleEvidence, staleStages: invalidStages };
  return addActivity(next, 'report-import', `Imported ${valid.kind} report for scoped project ${valid.project.project_id}. Referenced files and runtime were not checked by Studio.`, at);
}
export function evidenceRows(session) { return (session.report?.evidence || []).map(e => ({ ...e, effective_status: session.staleEvidence.includes(e.id) ? 'stale' : e.status, source: e.path, freshness: session.staleEvidence.includes(e.id) ? 'Requirement changed locally' : e.integrity === 'changed-or-unavailable' ? 'Artifact changed or unavailable in source report' : 'Source report checked integrity; not rechecked here' })); }
export function validateRating(r) {
  if (!plain(r)) throw new Error('Invalid candidate rating.'); exactKeys(r, ['candidate', 'dimension', 'kind', 'value', 'source', 'artifact', 'environment', 'recorded_at'], 'rating');
  choice(r.candidate, CANDIDATES.filter(c => !c.rejected).map(c => c.id), 'rated candidate'); choice(r.dimension, Object.keys(RUBRIC), 'rubric dimension'); choice(r.kind, ['unknown', 'judgment', 'measured'], 'rating kind');
  if (r.kind === 'unknown' ? r.value !== null : !Number.isFinite(r.value) || r.value < 0 || r.value > 5) throw new Error('Candidate values must be 0–5, or null when unknown.');
  const clean = { ...r, source: boundedText(r.source, 500, 'Rating source'), artifact: boundedText(r.artifact, 500, 'Rating artifact'), environment: boundedText(r.environment, 500, 'Rating environment'), recorded_at: timestamp(r.recorded_at, 'Rating date', true) };
  if (r.kind !== 'unknown' && !clean.source.trim()) throw new Error('A judgment or measurement needs its source.');
  if (r.kind === 'measured' && (!clean.artifact.trim() || !clean.environment.trim() || !clean.recorded_at)) throw new Error('Measured values require artifact, environment, and date.'); return clean;
}
export function recordRating(session, r) { const rating = validateRating(r); return { ...session, ratings: [...session.ratings.filter(v => v.candidate !== r.candidate || v.dimension !== r.dimension), rating] }; }
export function validateOutcome(o) {
  if (!plain(o)) throw new Error('Invalid outcome.'); identifier(o.id, 'outcome id'); choice(o.origin, ['human', 'scheduled', 'retry'], 'run origin'); nonempty(o.intent, 100, 'Outcome intent'); nonempty(o.outcome, 100, 'Outcome result'); boundedText(o.summary, 2000, 'Outcome summary'); boundedText(o.next_action, 2000, 'Next action'); timestamp(o.recorded_at, 'Outcome date');
  for (const key of ['changed', 'can_do_now', 'blocked', 'evidence_ids']) list(o[key], 100, key).forEach(v => boundedText(v, 1000, key));
  if (o.session_id !== undefined) nonempty(o.session_id, 100, 'Human session id');
  if (o.origin === 'human' && (o.job_id || o.parent_run_id)) throw new Error('Human outcomes cannot carry scheduled or retry identities.');
  if (o.origin === 'scheduled') nonempty(o.job_id, 100, 'Scheduled job id'); if (o.origin === 'retry') nonempty(o.parent_run_id, 100, 'Retry parent run id'); return safeTree(o);
}
export function recordOutcome(session, o) { const valid = validateOutcome(o); if ([...(session.report?.outcomes || []), ...session.outcomes].some(v => v.id === valid.id)) throw new Error('Outcome identity is already recorded.'); return { ...session, outcomes: [...session.outcomes, valid].slice(-100) }; }
export function outcomeCounts(outcomes) { const humans = outcomes.filter(o => o.origin === 'human'); return { human_sessions: humans.some(o => !o.session_id) ? null : new Set(humans.map(o => o.session_id)).size, scheduled_runs: outcomes.filter(o => o.origin === 'scheduled').length, retries: outcomes.filter(o => o.origin === 'retry').length, sample_size: outcomes.length }; }
export function validateFeedback(f) {
  if (!plain(f)) throw new Error('Invalid feedback.'); exactKeys(f, ['id', 'product', 'package_version', 'host', 'task_category', 'outcome', 'issue_category', 'note', 'evidence_ids', 'recorded_at'], 'feedback');
  return { id: identifier(f.id, 'feedback id'), product: choice(f.product, ['builder', 'extension'], 'feedback product'), package_version: boundedText(f.package_version, 100, 'Feedback version'), host: boundedText(f.host, 200, 'Feedback host'), task_category: nonempty(f.task_category, 100, 'Feedback task category'), outcome: choice(f.outcome, ['useful', 'partly-useful', 'blocked'], 'feedback outcome'), issue_category: choice(f.issue_category, FEEDBACK_CATEGORIES, 'feedback category'), note: boundedText(f.note, 500, 'Sanitized feedback note'), evidence_ids: list(f.evidence_ids, 100, 'feedback evidence').map(id => identifier(id, 'evidence id')), recorded_at: timestamp(f.recorded_at, 'Feedback date') };
}
export function feedbackExport(f) { const clean = validateFeedback(f); if (clean.product === 'builder') return { schema_version: 1, kind: 'local-feedback', product: clean.product, package_version: clean.package_version, host: clean.host, task_category: clean.task_category, outcome: clean.outcome, issue_category: clean.issue_category, recorded_at: clean.recorded_at, notice: 'Minimal builder feedback export. Notes, identifiers, project names, source, and evidence paths are omitted. Local notes are kept only when explicitly chosen.' }; return { schema_version: 1, kind: 'local-feedback', ...clean, notice: 'Project-scoped extension feedback. Review before sharing; never merge this with builder product feedback.' }; }
export function recordFeedback(session, f) { return { ...session, feedback: [...session.feedback, validateFeedback(f)].slice(-100) }; }
