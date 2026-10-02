/** Local planning model. Checklist completion is a declaration, never release proof. */
export const VERSION = 1;
export const MAX_SESSION_BYTES = 64000;
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
export const ROUND_WEIGHTS = [
  { safety: .35, simplicity: .2, usability: .25, resilience: .2 },
  { safety: .35, simplicity: .1, usability: .2, resilience: .35 },
  { safety: .35, simplicity: .1, usability: .4, resilience: .15 },
  { safety: .35, simplicity: .35, usability: .15, resilience: .15 }
];
export const CANDIDATES = [
  { id: 'focused', name: 'Focused local utility', type: 'local', surface: 'popup', backend: 'none', permissions: ['storage'], scores: { safety: 5, simplicity: 5, usability: 4, resilience: 5 }, detail: 'A compact popup with durable local state. Smallest operational footprint.' },
  { id: 'companion', name: 'Connected side panel', type: 'cloud', surface: 'sidepanel', backend: 'existing', permissions: ['storage', 'activeTab'], scores: { safety: 4, simplicity: 3, usability: 5, resilience: 4 }, detail: 'A persistent task surface connected to an authenticated API. Add explicit offline and sign-in states.' },
  { id: 'hybrid', name: 'Offline-first workspace', type: 'hybrid', surface: 'sidepanel', backend: 'new', permissions: ['storage'], scores: { safety: 4, simplicity: 2, usability: 5, resilience: 5 }, detail: 'Local-first drafts with optional cloud sync. Requires conflict handling, deletion, and account boundaries.' },
  { id: 'unsafe', name: 'Broad access + client secret', type: 'cloud', surface: 'popup', backend: 'new', permissions: ['tabs'], scores: { safety: 1, simplicity: 3, usability: 3, resilience: 2 }, rejected: true, detail: 'Rejected: unnecessary broad page access and a privileged secret in distributable client code.' }
];
export function defaultSession() {
  return { version: VERSION, project: { name: 'My useful extension', purpose: '', type: 'local', surface: 'popup', permissions: ['storage'], domains: '', backend: 'none' }, step: 'research', checks: Object.fromEntries(STEPS.map(s => [s.id, s.checks.map(() => false)])), candidate: 'focused', generation: 0 };
}
const plain = v => Boolean(v && typeof v === 'object' && !Array.isArray(v) && Object.getPrototypeOf(v) === Object.prototype);
function exactKeys(value, allowed, label) { for (const key of Object.keys(value)) if (!allowed.includes(key)) throw new Error(`Unexpected ${label} field: ${key}`); }
function boundedText(value, max, label) { if (typeof value !== 'string' || value.length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value)) throw new Error(`${label} must be text under ${max} characters without control characters.`); return value; }
function choice(value, allowed, label) { if (!allowed.includes(value)) throw new Error(`Invalid ${label}.`); return value; }
export function parseSession(raw) {
  if (typeof raw !== 'string' || new TextEncoder().encode(raw).length > MAX_SESSION_BYTES) throw new Error('Session exceeds the 64 KB import limit.');
  let input;
  try { input = JSON.parse(raw); } catch { throw new Error('Choose a valid JSON session file.'); }
  if (!plain(input) || !plain(input.project) || !plain(input.checks)) throw new Error('Session structure is invalid.');
  exactKeys(input, ['version', 'project', 'step', 'checks', 'candidate', 'generation'], 'session');
  exactKeys(input.project, ['name', 'purpose', 'type', 'surface', 'permissions', 'domains', 'backend'], 'project');
  exactKeys(input.checks, STEPS.map(s => s.id), 'checklist');
  if (input.version !== VERSION) throw new Error('Unsupported session version.');
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
export function progress(session) { const complete = Object.values(session.checks).flat().filter(Boolean).length; return { complete, total: 18, percent: Math.round(complete / 18 * 100) }; }
export function rankCandidates(session) {
  const weights = ROUND_WEIGHTS[session.generation];
  return CANDIDATES.map(c => ({ ...c, score: Math.round(Object.entries(weights).reduce((sum, [key, weight]) => sum + c.scores[key] * weight, 0) * 20), fit: c.type === session.project.type ? 1 : 0 })).sort((a, b) => Number(Boolean(a.rejected)) - Number(Boolean(b.rejected)) || b.fit - a.fit || b.score - a.score);
}
export function applyCandidate(session, id) {
  const candidate = CANDIDATES.find(c => c.id === id);
  if (!candidate || candidate.rejected) throw new Error('This candidate failed the safety gate.');
  return { ...session, candidate: id, project: { ...session.project, type: candidate.type, surface: candidate.surface, backend: candidate.backend, permissions: [...candidate.permissions] } };
}
export function evolve(session) { if (session.generation >= 2) throw new Error('Three comparison rounds are complete. Record evidence before starting another cycle.'); return { ...session, generation: session.generation + 1 }; }
export function shellQuote(value) { return `'${String(value).replaceAll("'", "'\\''")}'`; }
export function scaffoldCommand(session) {
  const p = session.project;
  const output = p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50) || 'my-extension';
  return `node skills/chrome-extension-builder/scripts/extension_builder.mjs scaffold --name=${shellQuote(p.name)} --purpose=${shellQuote(p.purpose)} --output=${shellQuote(`./${output}`)} --${p.surface === 'popup' ? 'popup' : 'side-panel'} --service-worker`;
}
export function briefMarkdown(session) {
  const p = session.project; const state = progress(session);
  const text = value => String(value).replaceAll('\r', '').replaceAll('\n', ' ').replace(/[<>]/g, '').replace(/[\\`*_{}\[\]()#!|]/g, '\\$&');
  const command = scaffoldCommand(session);
  const fence = '`'.repeat(Math.max(3, ...[...command.matchAll(/`+/g)].map(m => m[0].length + 1)));
  const lines = [`# ${text(p.name)}`, '', `Single purpose: ${text(p.purpose) || 'To define'}`, '', `Product: ${p.type} | Surface: ${p.surface} | Backend: ${p.backend}`, `Permissions to justify: ${p.permissions.join(', ') || 'none'}`, `Exact hosts to review: ${text(p.domains) || 'none declared'}`, '', '## Data boundaries', '', p.type === 'local' ? 'Page data → validated extension messages → local storage. No cloud transfer planned.' : 'Page data → validated extension messages → authenticated API → authorized account storage. Add retention, deletion, consent, retries, and offline behavior.', 'Privileged secrets remain on the server. Page content and messages are untrusted.', '', '## Scaffold command', '', 'Run from the plugin source folder with Node and Python available. The scaffold is a starter; selected permissions, host access, and cloud services still need implementation.', '', `${fence}sh`, command, fence, '', '## Declared workflow progress', '', `${state.complete}/${state.total} checklist items declared complete. This is not verified runtime, deployment, or store evidence.`, ''];
  for (const s of STEPS) { lines.push(`### ${s.label}`, ...s.checks.map((c, i) => `- [${session.checks[s.id][i] ? 'x' : ' '}] ${c}`), ''); }
  lines.push('## Verification states', '', '- Local plan: editable in this workbench', '- Built artifact: unverified', '- Chrome runtime behavior: unverified', '- Backend deployment: unverified', '- Store submission: unverified', '- Public listing: unverified', '', '## Specialist team', '', ...TEAM.map(([name, responsibility]) => `- ${name}: ${responsibility}`), '');
  return lines.join('\n');
}
