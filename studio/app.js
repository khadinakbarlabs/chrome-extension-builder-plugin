import { nextWork, taskHandoff, STEPS, VIEWS, PERMISSIONS, TEAM, RUBRIC, CONTEXT_FIELDS, contextPatch, MAX_SESSION_BYTES, defaultSession, parseSession, parseReport, issues, progress, rankCandidates, applyCandidate, candidateDiff, evolve, briefMarkdown, scaffoldCommand, changeProject, changeContext, declareCheck, importReport, evidenceRows, recordRating, recordOutcome, outcomeCounts, recordFeedback, feedbackExport, validateFeedback } from './model.mjs';
const $ = id => document.getElementById(id);
const key = 'extension-builder-studio-v2';
const legacyKey = 'extension-builder-studio-v1';
const now = () => new Date().toISOString();
const uid = () => crypto.randomUUID();
let session = defaultSession(uid());
let remembering = false;
let storageAvailable = true;
let pendingAction = null;
let dialogLauncher = null;
let feedbackDraft = null;
let captureUrl = null;
let captureRevision = 0;
const guidance = {
  research: 'Start with a real job people already try to do. Research alternatives and constraints, then define a single useful outcome.',
  architecture: 'Choose the smallest permission set and map every trust boundary. Cloud products need explicit identity, authorization, and data lifecycle decisions.',
  design: 'Pick a surface that fits the task. Make the first useful action clear, and design recovery, focus order, and every empty or error state.',
  build: 'Implement a vertical slice of the user journey. Treat page data as untrusted and design around a worker that can stop and restart.',
  test: 'Exercise the exact built extension in Chrome. Record the artifact and observed results, including offline behavior, denied permissions, and restarts.',
  release: 'Review the packaged artifact, privacy disclosures, and store assets together. Record submission, approval, and a live listing separately.'
};
const stateAdvice = {
  Empty: 'Show the task and one useful first action. Preserve any draft when the surface closes.',
  Loading: 'Explain ongoing work, allow cancellation where appropriate, and avoid repeated submission.',
  Success: 'Show the useful result with clear next actions. Do not discard input the user may need.',
  'Permission denied': 'Explain what cannot run, keep available work usable, and offer a deliberate permission retry.',
  Offline: 'Keep local work useful. Explain queued changes and reconcile conflicts before sync.',
  Error: 'Preserve the draft, explain the recoverable problem, and offer a safe retry without leaking internals.'
};
function el(tag, className, text) { const node = document.createElement(tag); if (className) node.className = className; if (text !== undefined) node.textContent = String(text); return node; }
function label(value) { return String(value).replaceAll('_', ' ').replaceAll('-', ' '); }
function text(value) { return typeof value === 'string' ? value : ''; }
function date(value) { return value ? new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : 'Date not recorded'; }
function announce(message, error = false) { $('notice').textContent = message; $('notice').className = `notice visible${error ? ' error' : ''}`; }
function badge(status) { return el('span', `status-label ${status}`, label(status)); }
function statusCard(name, value, note) { const card = el('div', 'status-card'); card.append(el('span', '', name), el('strong', '', value)); if (note) card.append(el('p', '', note)); return card; }
function empty(container, message) { container.replaceChildren(el('p', 'empty-state', message)); }
function record(title, body, metadata = []) { const node = el('article', 'record-item'); node.append(el('h3', '', title)); if (body) node.append(el('p', '', body)); const meta = el('div', 'record-meta'); for (const item of metadata) meta.append(item instanceof Node ? item : el('span', '', item)); node.append(meta); return node; }
function persist() {
  if (!remembering) return;
  try { localStorage.setItem(key, JSON.stringify(session)); }
  catch { remembering = false; storageAvailable = false; $('remember').checked = false; updateStorage(); announce('Browser storage is unavailable. Export your project handoff to keep this workspace.', true); }
}
function updateStorage() { $('remember').checked = remembering; $('storage-state').textContent = remembering ? 'Scoped context, imported reports, and chosen local notes are saved in this browser only.' : storageAvailable ? 'Workspace stays in memory until you export or enable remembering. No upload or global memory.' : 'Browser storage is unavailable. Export to keep this workspace.'; }
function load() {
  try {
    const raw = localStorage.getItem(key) || localStorage.getItem(legacyKey);
    if (raw) { session = parseSession(raw); remembering = true; if (!localStorage.getItem(key)) announce('Legacy plan loaded with declarations preserved. Evidence remains unverified; export to keep the migrated workspace.'); }
  } catch { storageAvailable = false; announce('Saved data could not be validated. It has not been overwritten. A fresh in-memory workspace is open.', true); }
  updateStorage();
}
function updateForm() {
  for (const field of ['name', 'purpose', 'type', 'surface', 'backend', 'domains']) $(field).value = session.project[field];
  for (const p of PERMISSIONS) $(`perm-${p}`).checked = session.project.permissions.includes(p);
  for (const field of CONTEXT_FIELDS) $(`context-${field}`).value = Array.isArray(session.context[field]) ? session.context[field].join('\n') : session.context[field];
}
function renderViews() {
  $('views').replaceChildren(...VIEWS.map((view, i) => { const button = el('button', `step-button${view.id === session.view ? ' active' : ''}`); button.type = 'button'; button.setAttribute('aria-current', view.id === session.view ? 'page' : 'false'); button.append(el('span', 'step-number', String(i + 1).padStart(2, '0')), el('span', '', view.label)); button.addEventListener('click', () => changeView(view.id)); return button; }));
  for (const view of VIEWS) $(`view-${view.id}`).hidden = view.id !== session.view;
  $('view-title').textContent = VIEWS.find(view => view.id === session.view).subtitle;
}
function changeView(view) { session = { ...session, view }; persist(); render(); $('view-title').setAttribute('tabindex', '-1'); $('view-title').focus({ preventScroll: true }); }
function renderSteps() {
  $('steps').replaceChildren(...STEPS.map((step, i) => { const button = el('button', `step-button${step.id === session.step ? ' active' : ''}`); button.type = 'button'; button.setAttribute('aria-current', step.id === session.step ? 'step' : 'false'); button.append(el('span', 'step-number', String(i + 1).padStart(2, '0')), el('span', '', step.label)); button.addEventListener('click', () => { session = { ...session, step: step.id }; persist(); render(); }); return button; }));
}
function checkNode(step, item, i) { const row = el('label', 'check-row'); const input = el('input'); input.type = 'checkbox'; input.checked = session.checks[step.id][i] && !session.staleChecks[step.id][i]; input.addEventListener('change', () => { session = declareCheck(session, step.id, i, input.checked); persist(); renderSummary(); renderOverview(); renderQuality(); renderSteps(); }); row.append(input, el('span', 'check-text', item)); if (session.staleChecks[step.id][i]) row.append(badge('stale')); else if (input.checked) row.append(badge('declared')); return row; }
function renderChecklist() { const step = STEPS.find(step => step.id === session.step); $('checklist').replaceChildren(...step.checks.map((item, i) => checkNode(step, item, i))); }
function renderSummary() {
  const p = session.project; const state = progress(session);
  $('project-crumb').textContent = p.name.trim() || 'Untitled project'; $('preview-name').textContent = p.name.trim() || 'Your extension';
  $('preview-purpose').textContent = p.purpose.trim() || 'Your extension’s purpose appears here.';
  $('preview-tag').textContent = p.type === 'local' ? 'LOCAL & PRIVATE' : p.type === 'cloud' ? 'CONNECTED WORKSPACE' : 'LOCAL FIRST · OPTIONAL SYNC';
  $('extension-preview').classList.toggle('sidepanel', p.surface === 'sidepanel');
  $('progress-count').textContent = `${state.complete} current · ${state.stale} stale`;
  $('declaration-status').replaceChildren(el('span', '', 'Declarations only; no completion percentage or release inference.'));
  $('phase-progress').replaceChildren(...STEPS.map(step => { const current = session.checks[step.id].filter((v, i) => v && !session.staleChecks[step.id][i]).length; const stale = session.staleChecks[step.id].filter(Boolean).length; const row = el('span', '', step.label); row.append(el('b', '', `${current} declared${stale ? ` · ${stale} stale` : ''}`)); return row; }));
  const nodes = p.type === 'local' ? ['Untrusted page', 'Validated extension', 'Local storage'] : ['Untrusted page', 'Validated extension', 'Authorized API', 'Account storage'];
  $('data-flow').replaceChildren(...nodes.flatMap((name, i) => i ? [el('span', 'flow-arrow', '→'), el('span', 'flow-node', name)] : [el('span', 'flow-node', name)]));
  $('permission-summary').textContent = `Planned permissions: ${p.permissions.join(', ') || 'none'}. ${p.domains.trim() ? 'Exact host access needs feature-by-feature justification.' : 'No host access declared.'}`;
  $('backend-hint').textContent = p.backend === 'none' ? 'Keep the core task on device. No server infrastructure is planned.' : p.backend === 'existing' ? 'Inspect the existing API and account boundaries before adding infrastructure. Verify authorization, CORS, and recovery.' : 'Plan identity, authorization, API contracts, database access, jobs, retention, deletion, and deployment.';
  $('purpose-count').textContent = `${p.purpose.length} / 132 characters`;
  $('name').setAttribute('aria-invalid', String(!p.name.trim())); $('purpose').setAttribute('aria-invalid', String(!p.purpose.trim() || p.purpose.length > 132));
  $('validation').replaceChildren(...issues(session).map(message => el('p', '', message))); $('command-text').textContent = scaffoldCommand(session);
}
function renderOverview() {
  const next = nextWork(session); $('continue-plan').textContent = `${next.title} →`;
  $('overview-goal').textContent = session.context.goal || session.project.purpose || 'Describe the useful outcome and acceptance journey. A small, clear first slice gives the team something concrete to verify.';
  $('overview-next').textContent = next.action;
  const evidence = evidenceRows(session); const blockers = evidence.filter(e => ['failed', 'stale'].includes(e.effective_status));
  $('overview-status').replaceChildren(statusCard('Current milestone', session.context.current_task || 'Planning', 'Project-scoped context'), statusCard('Latest useful artifact', evidence.at(-1)?.artifact || 'Not recorded', evidence.at(-1) ? date(evidence.at(-1).recorded_at) : 'Import a sourced project report'), statusCard('Evidence needing attention', String(blockers.length), 'Failed or stale records in this workspace only'), statusCard('Runtime / distribution', 'Not established here', 'Imported records are not live browser or store verification'));
  const decisions = session.report?.decisions || [];
  $('report-identity').textContent = session.report ? `Project ${session.report.project.project_id}` : 'No canonical project report imported';
  if (!decisions.length) empty($('decision-list'), 'No sourced decisions imported. The local context above is a draft, not an accepted architecture decision. Use the session helper to record confirmed, observed, or provisional choices with source and scope.');
  else $('decision-list').replaceChildren(...decisions.map(d => record(`${d.key}: ${d.value}`, `Source: ${d.source}. Scope: ${d.scope}.`, [badge(d.confidence), badge(d.status), date(d.recorded_at), d.evidence_ids.length ? `Evidence: ${d.evidence_ids.join(', ')}` : 'No evidence pointers'])));
  const conflicts = session.report?.conflicts || [];
  for (const conflict of conflicts) $('decision-list').append(record(`Unresolved choice: ${text(conflict.key)}`, `Scope: ${text(conflict.scope)}. Explicitly resolve competing decisions in the source project; Studio does not choose a winner.`, [badge('conflict'), ...(conflict.decision_ids || []).map(id => `Decision ${id}`)]));
  $('context-provenance').replaceChildren(...Object.entries(session.report?.context_provenance || {}).map(([key, source]) => { const changed = JSON.stringify(session.context[key]) !== JSON.stringify(session.report.context[key]); return record(`${label(key)} · ${changed ? 'local draft differs' : 'imported source'}`, changed ? 'Current edit is provisional and has not been applied to the source project. The imported confirmed choice remains preserved in its report.' : `${source.source}. Scope: ${source.scope}.`, [badge(changed ? 'provisional' : source.confidence), date(source.recorded_at)]); }));
  $('report-provenance').textContent = session.report ? `Imported ${session.report.kind} report generated ${date(session.report.generated_at)}. Studio has not read referenced project files. Locally edited context remains a draft until applied in the authorized project.` : 'Continuity is local or explicitly transferred through exports. Studio does not acquire host execution, global memory, or project filesystem access.';
}
function reviewChanges(title, changes, impact, apply, launcher) {
  pendingAction = apply; dialogLauncher = launcher || document.activeElement;
  $('candidate-dialog-title').textContent = title;
  $('candidate-diff').replaceChildren(...changes.map(change => { const row = el('div', 'record-item diff-row'); row.append(el('span', '', label(change.field)), el('strong', '', `${Array.isArray(change.before) ? change.before.join(', ') : change.before || 'Not set'} → ${Array.isArray(change.after) ? change.after.join(', ') : change.after || 'Not set'}`)); return row; }));
  if (!changes.length) empty($('candidate-diff'), 'No architecture fields differ. This changes only the selected comparison pattern.');
  $('candidate-impact').textContent = impact; $('candidate-dialog').showModal();
}
function renderCandidates() {
  $('round-label').textContent = `Round ${session.generation + 1} of 3 · selected pattern: ${session.candidate}`;
  $('score-weights').textContent = Object.entries(RUBRIC).map(([name, value]) => `${value}% ${label(name)}`).join(' · ');
  $('evolve').disabled = session.generation >= 2; $('evolve').textContent = session.generation >= 2 ? 'Three rounds recorded' : 'Record comparison round';
  $('candidates').replaceChildren(...rankCandidates(session).map(candidate => {
    const card = el('article', `candidate${candidate.id === session.candidate ? ' selected' : ''}${candidate.rejected ? ' rejected' : ''}`);
    card.append(el('div', 'candidate-state', candidate.rejected ? 'SAFETY GATE · REJECTED' : candidate.id === session.candidate ? 'CURRENT COMPARISON PATTERN' : candidate.fit ? 'MATCHES PRODUCT MODEL' : 'ALTERNATIVE PATTERN'), el('h3', '', candidate.name));
    const score = el('div', 'candidate-score', candidate.rejected ? 'Blocked' : candidate.score === null ? 'Unknown' : String(candidate.score)); score.append(el('span', '', candidate.rejected ? 'hard gate' : candidate.score === null ? 'no complete measurement' : '/100 · supplied measurements')); card.append(score, el('p', '', candidate.detail));
    const dimensions = el('div', 'score-dimensions'); for (const metric of candidate.metrics) dimensions.append(el('span', '', `${label(metric.dimension)}: ${metric.kind === 'unknown' ? 'unknown' : `${metric.value}/5 · ${metric.kind}`}`)); card.append(dimensions);
    const button = el('button', 'button outline', candidate.rejected ? 'Cannot select' : 'Review proposed changes'); button.type = 'button'; button.disabled = Boolean(candidate.rejected);
    button.addEventListener('click', () => reviewChanges(`Review ${candidate.name}`, candidateDiff(session, candidate.id), 'Applying material changes preserves existing records but marks affected declarations and imported evidence stale. Supplied candidate ratings return to unknown. This is not a generated or measured improvement.', () => { session = applyCandidate(session, candidate.id, now()); persist(); updateForm(); render(); announce('Reviewed architecture applied. Affected declarations and evidence are stale; unchanged fields remain intact.'); }, button)); card.append(button); return card;
  }));
}
function renderQuality() {
  const rows = evidenceRows(session);
  $('quality-rows').replaceChildren(...rows.map(e => { const row = el('tr'); const finding = el('td'); finding.append(el('strong', '', e.category), el('p', '', e.path)); const result = el('td'); result.append(badge(e.effective_status), el('p', '', `Originally recorded: ${label(e.recorded_status)}`)); const freshness = el('td', '', e.freshness); const artifact = el('td'); artifact.append(el('strong', '', e.artifact), el('p', '', e.environment)); const source = el('td'); source.append(el('strong', '', date(e.recorded_at)), el('p', '', `Report generated ${date(session.report.generated_at)}`)); row.append(finding, result, freshness, artifact, source); return row; }));
  $('quality-empty').hidden = Boolean(rows.length); $('quality-empty').textContent = 'No observed acceptance evidence is available in this workspace. Import the canonical project report; declarations and planning illustrations are not test results.';
  $('all-checks').replaceChildren(...STEPS.map(step => { const item = el('section', 'record-item'); item.append(el('h3', '', step.label)); item.append(...step.checks.map((check, i) => checkNode(step, check, i))); return item; }));
}
function renderFeedback() {
  const imported = session.report?.feedback || [...(session.report?.builder_feedback || []), ...(session.report?.extension_feedback || [])];
  const items = [...imported, ...session.feedback];
  if (!items.length) return empty($('feedback-list'), 'No feedback recorded. Optional local feedback can help the current task; it is never collected automatically or required to continue.');
  $('feedback-list').replaceChildren(...items.map(f => record(`${f.product === 'builder' ? 'Builder plugin' : 'Generated extension'} · ${label(f.issue_category || f.category || 'issue')}`, text(f.note) || 'No voluntary note included.', [badge(text(f.outcome) || 'unknown'), text(f.host) || 'Host unknown', text(f.package_version) || 'Version unknown', date(f.recorded_at)])));
}
function allOutcomes() { return [...(session.report?.outcomes || []), ...session.outcomes]; }
function renderActivity() {
  const outcomes = allOutcomes(); const counts = outcomeCounts(outcomes); const dates = outcomes.map(o => o.recorded_at).sort();
  $('activity-counts').replaceChildren(statusCard('Human sessions', counts.human_sessions === null ? 'Unknown' : String(counts.human_sessions), counts.human_sessions === null ? 'At least one human outcome lacks a supplied session ID' : 'Distinct supplied session IDs'), statusCard('Scheduled runs', String(counts.scheduled_runs), 'Explicit records, not an active schedule'), statusCard('Automated retries', String(counts.retries), 'Excluded from human sessions'), statusCard('Observation sample', `${counts.sample_size} outcome records`, outcomes.length ? `${date(dates[0])} to ${date(dates.at(-1))}` : 'No observation window or sample exists yet'));
  if (!outcomes.length) empty($('outcome-list'), 'No session outcomes imported or recorded. Opening Studio does not generate usage or retention data.');
  else $('outcome-list').replaceChildren(...outcomes.map(o => record(`${label(o.origin)} · ${label(o.intent)} · ${o.outcome}`, o.summary, [date(o.recorded_at), `Next: ${o.next_action || 'not recorded'}`, o.session_id ? `Session: ${o.session_id}` : 'Human session identity not supplied', ...(o.evidence_ids || []).map(id => `Evidence ${id}`)])));
  const jobs = session.report?.jobs || [];
  if (!jobs.length) empty($('job-list'), 'No host follow-up specifications imported. Studio never activates or controls a schedule.');
  else $('job-list').replaceChildren(...jobs.map(job => record(`${label(text(job.kind))} · ${text(job.state)}`, `${text(job.cadence)} in ${text(job.timezone)}. Source: ${text(job.source_identifier)}. Context: ${text(job.context_pointer)}.`, [badge(text(job.activation_integrity) || 'not-recorded'), 'Host activation/execution unverified here', job.state === 'paused' || job.state === 'stopped' ? 'Local intent; host control separate' : 'Specification or supplied activation record only'])));
  if (!session.activity.length) empty($('activity-list'), 'Meaningful local requirement changes and report imports will appear here. This is an editable local trail, not a host activity log.');
  else $('activity-list').replaceChildren(...[...session.activity].reverse().map(a => record(label(a.type), a.summary, [date(a.recorded_at), 'Local workspace record'])));
}
function renderRelease() {
  const rows = evidenceRows(session); const releaseRows = rows.filter(e => /release|store|listing|submission|package|distribution/.test(e.category.toLowerCase()));
  $('release-states').replaceChildren(statusCard('Package', releaseRows.find(e => /package/i.test(e.category))?.effective_status || 'Not run', 'Requires exact reviewed artifact'), statusCard('Browser behavior', rows.find(e => /browser|runtime/i.test(e.category))?.effective_status || 'Not run', 'Recorded result only; not rerun here'), statusCard('Store submission', 'Unknown', 'Tracker does not verify submission'), statusCard('Public listing', 'Unknown', 'Tracker does not verify publication'));
  if (!releaseRows.length) empty($('release-findings'), 'No package or release evidence imported. A completed checklist cannot establish a release-ready artifact or a public listing.');
  else $('release-findings').replaceChildren(...releaseRows.map(e => record(e.category, `${e.artifact}. Environment: ${e.environment}. Source: ${e.path}.`, [badge(e.effective_status), date(e.recorded_at), e.freshness])));
}
function render() {
  const index = STEPS.findIndex(step => step.id === session.step); const step = STEPS[index];
  $('phase-number').textContent = String(index + 1).padStart(2, '0'); $('phase-label').textContent = step.label.toUpperCase(); $('phase-title').textContent = step.subtitle; $('phase-guidance').textContent = guidance[step.id];
  $('previous').disabled = index === 0; $('next').disabled = index === STEPS.length - 1; $('next').textContent = index === STEPS.length - 1 ? 'Release phase' : `Next: ${STEPS[index + 1].label} →`;
  renderViews(); renderSteps(); renderChecklist(); renderSummary(); renderCandidates(); renderOverview(); renderQuality(); renderFeedback(); renderActivity(); renderRelease(); updateStorage();
}
function download(content, extension, type, name = 'handoff') { const slug = session.project.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50) || 'extension'; const url = URL.createObjectURL(new Blob([content], { type })); const link = el('a'); link.href = url; link.download = `${name === 'builder-feedback' ? 'builder' : slug}-${name}.${extension}`; document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
for (const permission of PERMISSIONS) { const row = el('label', 'permission-pill'); const input = el('input'); input.type = 'checkbox'; input.id = `perm-${permission}`; row.append(input, el('span', '', permission)); $('permissions').append(row); }
$('team').replaceChildren(...TEAM.map(([name, responsibility], i) => { const role = el('div', 'team-role'); const content = el('div'); content.append(el('h3', '', name), el('p', '', responsibility)); role.append(el('span', 'team-icon', String(i + 1).padStart(2, '0')), content); return role; }));
$('experience-preview-slot').append(document.querySelector('.preview-column > .preview'));
$('rating-dimension').replaceChildren(...Object.keys(RUBRIC).map(key => { const option = el('option', '', label(key)); option.value = key; return option; }));
$('continue-plan').addEventListener('click', () => changeView(nextWork(session).view));
$('export-task').addEventListener('click', () => { download(JSON.stringify(taskHandoff(session), null, 2), 'json', 'application/json', 'next-task'); announce('Next-task handoff exported. Review the selected route and reconcile current files before acting.'); });
$('project-form').addEventListener('submit', event => event.preventDefault());
$('project-form').addEventListener('input', event => { const field = event.target.id; let patch = null; if (['name', 'purpose', 'type', 'surface', 'backend', 'domains'].includes(field)) patch = { [field]: event.target.value }; else if (field.startsWith('perm-')) patch = { permissions: PERMISSIONS.filter(p => $(`perm-${p}`).checked) }; if (!patch) return; try { session = changeProject(session, patch); persist(); renderSummary(); renderChecklist(); renderOverview(); renderQuality(); renderRelease(); renderCandidates(); } catch (error) { announce(error.message, true); } });
$('project-form').addEventListener('change', event => { session = { ...session, activity: [...session.activity, { id: uid(), type: 'project-change', summary: `Reviewed local change: ${label(event.target.id)}. Affected checks require review.`, recorded_at: now() }].slice(-100) }; persist(); renderActivity(); });
$('context-form').addEventListener('submit', event => event.preventDefault());
$('context-form').addEventListener('input', event => { const field = event.target.id.replace('context-', ''); if (!CONTEXT_FIELDS.includes(field)) return; try { session = changeContext(session, { [field]: ['acceptance_journey', 'constraints'].includes(field) ? event.target.value.split('\n').map(v => v.trim()).filter(Boolean) : event.target.value }); persist(); renderOverview(); renderSummary(); renderChecklist(); renderQuality(); renderRelease(); } catch (error) { announce(error.message, true); } });
$('context-form').addEventListener('change', event => { session = { ...session, activity: [...session.activity, { id: uid(), type: 'context-change', summary: `Updated local scoped context: ${label(event.target.id.replace('context-', ''))}.`, recorded_at: now() }].slice(-100) }; persist(); renderActivity(); });
for (const [id, offset] of [['previous', -1], ['next', 1]]) $(id).addEventListener('click', () => { session = { ...session, step: STEPS[STEPS.findIndex(step => step.id === session.step) + offset].id }; persist(); render(); $('phase-title').setAttribute('tabindex', '-1'); $('phase-title').focus({ preventScroll: true }); });
$('evolve').addEventListener('click', () => { try { session = evolve(session, now()); persist(); renderCandidates(); renderActivity(); announce('Comparison round recorded under the same rubric. No candidate was generated or improved by recording the round.'); } catch (error) { announce(error.message, true); } });
$('candidate-dialog').querySelector('form').addEventListener('submit', event => { if (event.submitter?.value === 'apply' && pendingAction) { try { pendingAction(); } catch (error) { announce(error.message, true); } } });
$('candidate-dialog').addEventListener('close', () => { pendingAction = null; if (dialogLauncher?.isConnected) dialogLauncher.focus({ preventScroll: true }); else $('view-title').focus({ preventScroll: true }); dialogLauncher = null; });
$('export').addEventListener('click', () => { download(JSON.stringify(session, null, 2), 'json', 'application/json', 'workspace'); announce('Project workspace exported. It contains scoped context and selected local records; review before sharing.'); });
$('export-context').addEventListener('click', () => { try { download(JSON.stringify(contextPatch(session.context), null, 2), 'json', 'application/json', 'context'); announce('Populated context fields exported as a partial patch. Unset fields are omitted; this does not clear existing project values. Apply through the session helper in the authorized project.'); } catch (error) { announce(error.message, true); } });
$('brief').addEventListener('click', () => { download(briefMarkdown(session), 'md', 'text/markdown'); announce('Project handoff exported with context, sourced records, and explicit unverified states.'); });
$('import').addEventListener('click', () => $('import-file').click());
$('import-file').addEventListener('change', async event => {
  const file = event.target.files[0]; if (!file) return;
  try {
    if (file.size > MAX_SESSION_BYTES) throw new Error('Import exceeds the 1 MiB limit.');
    const raw = await file.text(); const kind = JSON.parse(raw);
    if (kind.schema_version === 1 && kind.kind) {
      const report = parseReport(raw); const different = session.report && session.report.project.project_id !== report.project.project_id;
      const changes = [{ field: 'project identity', before: session.report?.project.project_id || 'No report imported', after: report.project.project_id }, ...CONTEXT_FIELDS.filter(k => JSON.stringify(session.context[k]) !== JSON.stringify(report.context[k])).map(k => ({ field: k, before: session.context[k], after: report.context[k] }))];
      reviewChanges(different ? 'Replace this project workspace?' : 'Review imported project report', changes, different ? 'Different project identity: applying clears local planning/context/feedback/outcomes in this workspace and loads the supplied project. Export current work first if needed.' : 'Imported facts remain source records. Changed context invalidates affected declarations; integrity and browser behavior are not rechecked by Studio.', () => { session = importReport(session, report, { replace: Boolean(different), at: now() }); persist(); updateForm(); render(); announce('Scoped project report imported. Recorded results and source integrity are distinct from live verification.'); }, $('import'));
    } else {
      const imported = parseSession(raw);
      reviewChanges('Replace local workspace with imported plan?', [{ field: 'workspace', before: session.project.name, after: imported.project.name }, { field: 'project report', before: session.report?.project.project_id || 'None', after: imported.report?.project.project_id || 'None' }], 'This explicit replacement loads only validated local plan data. Checklist declarations and imported measurements do not become live verification.', () => { session = imported; persist(); updateForm(); render(); announce('Workspace imported. Project scope, stale declarations, and evidence provenance were preserved.'); }, $('import'));
    }
  } catch (error) { announce(`Import rejected: ${error.message}`, true); }
  finally { event.target.value = ''; }
});
$('remember').addEventListener('change', () => { remembering = $('remember').checked; if (remembering) persist(); else { try { localStorage.removeItem(key); localStorage.removeItem(legacyKey); } catch { storageAvailable = false; } } updateStorage(); announce(remembering ? 'Remembering enabled for this browser only. Selected context, reports, and local feedback remain on this device.' : 'Remembering disabled and saved browser copies removed. Current work stays in memory.'); });
$('reset').addEventListener('click', () => { session = defaultSession(uid()); remembering = false; feedbackDraft = null; $('feedback-preview-area').hidden = true; clearCapture(); try { localStorage.removeItem(key); localStorage.removeItem(legacyKey); } catch { storageAvailable = false; } updateForm(); render(); announce('Local workspace and saved browser copies cleared. Downloaded files and source project records remain under your control.'); });
$('theme').addEventListener('click', () => { const dark = document.body.classList.toggle('dark'); $('theme').textContent = dark ? 'Use light theme' : 'Use dark theme'; });
$('commands').addEventListener('click', () => { $('command-area').hidden = !$('command-area').hidden; $('commands').textContent = $('command-area').hidden ? 'Show scaffold command' : 'Hide scaffold command'; $('commands').setAttribute('aria-expanded', String(!$('command-area').hidden)); if (!$('command-area').hidden) $('command-text').focus({ preventScroll: true }); });
$('commands').setAttribute('aria-expanded', 'false'); $('commands').setAttribute('aria-controls', 'command-area');
$('copy-command').addEventListener('click', async () => { try { await navigator.clipboard.writeText(scaffoldCommand(session)); announce('Starter command copied. It does not implement arbitrary project features or cloud services.'); } catch { announce('Clipboard unavailable. Select the command and copy it with your keyboard.', true); $('command-text').focus(); } });
$('rating-form').addEventListener('submit', event => { event.preventDefault(); try { const kind = $('rating-kind').value; const value = $('rating-value').value; session = recordRating(session, { candidate: $('rating-candidate').value, dimension: $('rating-dimension').value, kind, value: kind === 'unknown' ? null : value === '' ? NaN : Number(value), source: $('rating-source').value, artifact: $('rating-artifact').value, environment: $('rating-environment').value, recorded_at: $('rating-date').value ? new Date($('rating-date').value).toISOString() : '' }); persist(); renderCandidates(); announce('Supplied candidate record saved. Unknown dimensions stay unknown; the rubric does not change between rounds.'); } catch (error) { announce(error.message, true); } });
$('feedback-form').addEventListener('submit', event => { event.preventDefault(); try { feedbackDraft = validateFeedback({ id: uid(), product: $('feedback-target').value, package_version: $('feedback-version').value, host: $('feedback-host').value, task_category: $('feedback-intent').value, outcome: $('feedback-outcome').value, issue_category: $('feedback-category').value, note: $('feedback-note').value, evidence_ids: [], recorded_at: now() }); $('feedback-preview').textContent = JSON.stringify(feedbackExport(feedbackDraft), null, 2); $('feedback-preview-area').hidden = false; $('feedback-redacted').checked = false; $('save-feedback').disabled = true; $('export-feedback').disabled = true; announce('Minimal share report previewed. Builder exports omit free-text notes and identifiers. Keeping locally retains your voluntary note on this device.'); } catch (error) { announce(error.message, true); } });
$('feedback-redacted').addEventListener('change', () => { $('save-feedback').disabled = !$('feedback-redacted').checked; $('export-feedback').disabled = !$('feedback-redacted').checked; });
$('save-feedback').addEventListener('click', () => { if (!feedbackDraft || !$('feedback-redacted').checked) return; session = recordFeedback(session, feedbackDraft); feedbackDraft = null; $('feedback-preview-area').hidden = true; persist(); renderFeedback(); announce('Feedback retained locally by explicit choice. No report was uploaded or shared.'); });
$('export-feedback').addEventListener('click', () => { if (!feedbackDraft || !$('feedback-redacted').checked) return; download(JSON.stringify(feedbackExport(feedbackDraft), null, 2), 'json', 'application/json', `${feedbackDraft.product}-feedback`); announce('Reviewed feedback exported. You choose any recipient separately; Studio does not send it.'); });
$('outcome-form').addEventListener('submit', event => { event.preventDefault(); try { const summary = $('outcome-summary').value.trim(); if (!summary) throw new Error('Describe the actual outcome before recording it.'); const origin = $('outcome-origin').value; const o = { id: uid(), origin, intent: $('outcome-intent').value, outcome: $('outcome-result').value, summary, changed: [], can_do_now: [], blocked: [], next_action: $('outcome-next').value, evidence_ids: [], recorded_at: now() }; if ($('outcome-session').value.trim()) o.session_id = $('outcome-session').value.trim(); if (origin === 'scheduled') o.job_id = $('outcome-job').value.trim(); if (origin === 'retry') o.parent_run_id = $('outcome-parent').value.trim(); session = recordOutcome(session, o); persist(); renderActivity(); announce('Scoped outcome recorded from your supplied recap. It does not activate a schedule or prove successful execution.'); } catch (error) { announce(error.message, true); } });
$('experience-state').addEventListener('change', () => { $('experience-advice').textContent = stateAdvice[$('experience-state').value]; });
function clearCapture() { captureRevision++; captureUrl = null; $('capture-image').removeAttribute('src'); $('capture-file').value = ''; $('capture-area').hidden = true; }
$('capture-file').addEventListener('change', event => { const file = event.target.files[0]; if (!file) return; if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 2 * 1024 * 1024) { event.target.value = ''; announce('Choose a PNG, JPEG, or WebP screenshot under 2 MiB. SVG and executable content are not accepted.', true); return; } const revision = ++captureRevision; const reader = new FileReader(); reader.addEventListener('load', () => { if (revision !== captureRevision) return; captureUrl = reader.result; $('capture-image').src = captureUrl; }); reader.addEventListener('error', () => { if (revision !== captureRevision) return; clearCapture(); announce('Screenshot could not be read. Choose a valid local image.', true); }); reader.readAsDataURL(file); $('capture-label').textContent = `${label($('capture-kind').value)} · ${$('experience-state').value} · ${file.name} · chosen ${date(now())}. Image exists in this page session only; no behavior verified.`; $('capture-area').hidden = false; });
$('clear-capture').addEventListener('click', clearCapture);
$('capture-image').addEventListener('error', () => { clearCapture(); announce('This image could not be decoded. Choose a valid local screenshot.', true); });
window.addEventListener('pagehide', clearCapture);
$('experience-advice').textContent = stateAdvice.Empty;
load(); updateForm(); render();
