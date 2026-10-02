import { STEPS, PERMISSIONS, TEAM, ROUND_WEIGHTS, MAX_SESSION_BYTES, defaultSession, parseSession, issues, progress, rankCandidates, applyCandidate, evolve, briefMarkdown, scaffoldCommand } from './model.mjs';
const $ = id => document.getElementById(id);
const key = 'extension-builder-studio-v1';
let session = defaultSession();
let remembering = false;
let storageAvailable = true;
const guidance = {
  research: 'Start with a real job people already try to do. Research alternatives and constraints, then define a single useful outcome.',
  architecture: 'Choose the smallest permission set and map every trust boundary. Cloud products need explicit identity, authorization, and data lifecycle decisions.',
  design: 'Pick a surface that fits the task. Make the first useful action clear, and design recovery, focus order, and every empty or error state.',
  build: 'Implement a vertical slice of the user journey. Treat content-script data as untrusted and design around a service worker that can stop and restart.',
  test: 'Exercise the exact built extension in Chrome. Record the artifact and observed results, including offline behavior, denied permissions, and restarts.',
  release: 'Review the packaged artifact, privacy disclosures, and store assets together. Record submission, approval, and a live public listing as distinct events.'
};
function el(tag, className, text) { const node = document.createElement(tag); if (className) node.className = className; if (text !== undefined) node.textContent = text; return node; }
function announce(message, error = false) { $('notice').textContent = message; $('notice').className = `notice visible${error ? ' error' : ''}`; }
function persist() {
  if (!remembering) return;
  try { localStorage.setItem(key, JSON.stringify(session)); }
  catch { remembering = false; storageAvailable = false; $('remember').checked = false; updateStorage(); announce('Browser storage is unavailable. Export a session file to keep this plan.', true); }
}
function updateStorage() { $('remember').checked = remembering; $('storage-state').textContent = remembering ? 'Plan saved in this browser only. Clear plan removes the saved copy.' : storageAvailable ? 'Session stays in memory until you export or enable remembering.' : 'Browser storage is unavailable. Export to keep this plan.'; }
function load() {
  try { const raw = localStorage.getItem(key); if (raw) { session = parseSession(raw); remembering = true; } }
  catch { storageAvailable = false; announce('A saved session could not be loaded. A fresh plan is open; you can import a valid session.', true); }
  updateStorage();
}
function updateForm() {
  for (const field of ['name', 'purpose', 'type', 'surface', 'backend', 'domains']) $(field).value = session.project[field];
  for (const p of PERMISSIONS) $(`perm-${p}`).checked = session.project.permissions.includes(p);
}
function renderSteps() {
  const nodes = STEPS.map((s, i) => { const button = el('button', `step-button${s.id === session.step ? ' active' : ''}`); button.type = 'button'; button.setAttribute('aria-current', s.id === session.step ? 'step' : 'false'); button.append(el('span', 'step-number', String(i + 1).padStart(2, '0')), el('span', '', s.label)); if (session.checks[s.id].every(Boolean)) button.append(el('span', 'step-check', '✓')); button.addEventListener('click', () => changeStep(s.id)); return button; });
  $('steps').replaceChildren(...nodes);
}
function changeStep(id) { session = { ...session, step: id }; persist(); render(); $('phase-title').setAttribute('tabindex', '-1'); $('phase-title').focus({ preventScroll: true }); }
function renderChecklist() {
  const step = STEPS.find(s => s.id === session.step);
  $('checklist').replaceChildren(...step.checks.map((item, i) => { const label = el('label', 'check-row'); const input = el('input'); input.type = 'checkbox'; input.checked = session.checks[step.id][i]; input.addEventListener('change', () => { session = { ...session, checks: { ...session.checks, [step.id]: session.checks[step.id].map((v, n) => n === i ? input.checked : v) } }; persist(); renderSummary(); renderSteps(); }); label.append(input, el('span', '', item)); return label; }));
}
function renderSummary() {
  const p = session.project; const state = progress(session);
  $('project-crumb').textContent = p.name.trim() || 'Untitled project';
  $('preview-name').textContent = p.name.trim() || 'Your extension';
  $('preview-purpose').textContent = p.purpose.trim() || 'Your extension’s purpose appears here.';
  $('preview-tag').textContent = p.type === 'local' ? 'LOCAL & PRIVATE' : p.type === 'cloud' ? 'CONNECTED WORKSPACE' : 'LOCAL FIRST · OPTIONAL SYNC';
  $('extension-preview').classList.toggle('sidepanel', p.surface === 'sidepanel');
  $('progress').value = state.complete; $('progress-count').textContent = `${state.complete} / ${state.total}`;
  $('phase-progress').replaceChildren(...STEPS.map(s => { const row = el('span', '', s.label); row.append(el('b', '', `${session.checks[s.id].filter(Boolean).length}/3`)); return row; }));
  const nodes = p.type === 'local' ? ['Page', 'Extension', 'Local storage'] : ['Page', 'Extension', 'Auth API', 'Account data'];
  $('data-flow').replaceChildren(...nodes.flatMap((name, i) => i ? [el('span', 'flow-arrow', '→'), el('span', 'flow-node', name)] : [el('span', 'flow-node', name)]));
  $('permission-summary').textContent = `Planned permissions: ${p.permissions.join(', ') || 'none'}. ${p.domains.trim() ? 'Exact host access needs review.' : 'No host access declared.'}`;
  $('backend-hint').textContent = p.backend === 'none' ? 'Keep the core task on device. No server infrastructure is planned.' : p.backend === 'existing' ? 'Verify API access, OAuth or session flow, account authorization, CORS, and error handling.' : 'Plan the API contract, identity, database access, jobs, rate limits, retention, deletion, and deployment.';
  const characters = p.purpose.length;
  $('purpose-count').textContent = `${characters} / 132 characters`;
  $('name').setAttribute('aria-invalid', String(!p.name.trim()));
  $('purpose').setAttribute('aria-invalid', String(!p.purpose.trim() || characters > 132));
  $('validation').replaceChildren(...issues(session).map(message => el('p', '', message)));
  $('command-text').textContent = scaffoldCommand(session);
}
function renderCandidates() {
  $('round-label').textContent = `Round ${session.generation + 1} of 3 · selected: ${session.candidate}`;
  $('score-weights').textContent = Object.entries(ROUND_WEIGHTS[session.generation]).map(([name, value]) => `${Math.round(value * 100)}% ${name}`).join(' · ');
  $('evolve').disabled = session.generation >= 2;
  $('evolve').textContent = session.generation >= 2 ? 'Comparison complete' : 'Compare next round';
  $('candidates').replaceChildren(...rankCandidates(session).map(c => {
    const card = el('article', `candidate${c.id === session.candidate ? ' selected' : ''}${c.rejected ? ' rejected' : ''}`);
    card.append(el('div', 'candidate-state', c.rejected ? 'SAFETY GATE · REJECTED' : c.id === session.candidate ? 'SELECTED APPROACH' : c.fit ? 'MATCHES PRODUCT MODEL' : 'ALTERNATIVE'));
    card.append(el('h3', '', c.name));
    const score = el('div', 'candidate-score', c.rejected ? '—' : String(c.score)); score.append(el('span', '', c.rejected ? 'blocked' : '/ 100')); card.append(score);
    card.append(el('p', '', c.detail));
    const dimensions = el('div', 'score-dimensions'); for (const [name, score] of Object.entries(c.scores)) dimensions.append(el('span', '', `${name} ${score}/5`)); card.append(dimensions);
    const button = el('button', 'button outline', c.rejected ? 'Cannot select' : c.id === session.candidate ? 'Reapply this approach' : 'Apply to plan'); button.type = 'button'; button.disabled = Boolean(c.rejected); button.addEventListener('click', () => { session = applyCandidate(session, c.id); persist(); updateForm(); render(); announce(`Applied ${c.name}. Review permissions, backend, and any checklist declarations that need revisiting.`); }); card.append(button); return card;
  }));
}
function render() {
  const i = STEPS.findIndex(s => s.id === session.step); const step = STEPS[i];
  $('phase-number').textContent = String(i + 1).padStart(2, '0'); $('phase-label').textContent = step.label.toUpperCase(); $('phase-title').textContent = step.subtitle; $('phase-guidance').textContent = guidance[step.id];
  $('previous').disabled = i === 0; $('next').disabled = i === STEPS.length - 1; $('next').textContent = i === STEPS.length - 1 ? 'Release phase' : `Next: ${STEPS[i + 1].label} →`;
  renderSteps(); renderChecklist(); renderSummary(); renderCandidates(); updateStorage();
}
function download(content, extension, type) {
  const slug = session.project.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50) || 'extension';
  const url = URL.createObjectURL(new Blob([content], { type })); const link = el('a'); link.href = url; link.download = `${slug}-build.${extension}`; document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
for (const p of PERMISSIONS) { const label = el('label', 'permission-pill'); const input = el('input'); input.type = 'checkbox'; input.id = `perm-${p}`; input.checked = session.project.permissions.includes(p); label.append(input, el('span', '', p)); $('permissions').append(label); }
$('team').replaceChildren(...TEAM.map(([name, responsibility], i) => { const role = el('div', 'team-role'); const text = el('div'); text.append(el('h3', '', name), el('p', '', responsibility)); role.append(el('span', 'team-icon', String(i + 1).padStart(2, '0')), text); return role; }));
$('project-form').addEventListener('submit', event => event.preventDefault());
$('project-form').addEventListener('input', event => {
  const field = event.target.id;
  if (['name', 'purpose', 'type', 'surface', 'backend', 'domains'].includes(field)) session = { ...session, project: { ...session.project, [field]: event.target.value } };
  else if (field.startsWith('perm-')) session = { ...session, project: { ...session.project, permissions: PERMISSIONS.filter(p => $(`perm-${p}`).checked) } };
  persist(); renderSummary(); if (field === 'type') renderCandidates();
});
$('previous').addEventListener('click', () => changeStep(STEPS[STEPS.findIndex(s => s.id === session.step) - 1].id));
$('next').addEventListener('click', () => changeStep(STEPS[STEPS.findIndex(s => s.id === session.step) + 1].id));
$('evolve').addEventListener('click', () => { try { session = evolve(session); persist(); renderCandidates(); announce(`Comparison round ${session.generation + 1}: review the safety gate and product fit, apply a candidate, and record the evidence needed to refine it. This round changes the explicit scoring weights; scores remain template heuristics.`); } catch (error) { announce(error.message, true); } });
$('export').addEventListener('click', () => { download(JSON.stringify(session, null, 2), 'json', 'application/json'); announce('Session exported. The file includes your plan and checklist declarations.'); });
$('brief').addEventListener('click', () => { download(briefMarkdown(session), 'md', 'text/markdown'); announce('Build brief exported with the starter command and unverified release states.'); });
$('import').addEventListener('click', () => $('import-file').click());
$('import-file').addEventListener('change', async event => {
  const file = event.target.files[0]; if (!file) return;
  try { if (file.size > MAX_SESSION_BYTES) throw new Error('Session exceeds the 64 KB import limit.'); const imported = parseSession(await file.text()); session = imported; persist(); updateForm(); render(); announce('Session imported. Checklist completion remains a declaration, not verified evidence.'); }
  catch (error) { announce(`Import rejected: ${error.message}`, true); }
  finally { event.target.value = ''; }
});
$('remember').addEventListener('change', () => {
  remembering = $('remember').checked;
  if (remembering) persist(); else { try { localStorage.removeItem(key); } catch { storageAvailable = false; } }
  updateStorage(); announce(remembering ? 'Remembering enabled: your plan is stored on this device only.' : 'Remembering disabled. The current plan remains in memory.');
});
$('reset').addEventListener('click', () => {
  session = defaultSession(); remembering = false;
  try { localStorage.removeItem(key); } catch { storageAvailable = false; }
  updateForm(); render(); announce('Plan cleared, including any saved session in this browser.');
});
$('theme').addEventListener('click', () => { const dark = document.body.classList.toggle('dark'); $('theme').textContent = dark ? 'Use light theme' : 'Use dark theme'; });
$('commands').addEventListener('click', () => { const area = $('command-area'); area.hidden = !area.hidden; $('commands').textContent = area.hidden ? 'Show scaffold command' : 'Hide scaffold command'; $('commands').setAttribute('aria-expanded', String(!area.hidden)); if (!area.hidden) $('command-text').focus({ preventScroll: true }); });
$('commands').setAttribute('aria-expanded', 'false'); $('commands').setAttribute('aria-controls', 'command-area');
$('copy-command').addEventListener('click', async () => { try { await navigator.clipboard.writeText(scaffoldCommand(session)); announce('Scaffold command copied. Review the single purpose before running it.'); } catch { announce('Clipboard is unavailable. Select the command and copy it with your keyboard.', true); $('command-text').focus(); } });
load(); updateForm(); render();
