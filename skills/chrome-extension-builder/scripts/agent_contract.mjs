/** Bounded local receipts: no network, automatic installation or replay. */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';

export const OPERATIONS = {
  scaffold: 'skills/chrome-extension-builder/scripts/scaffold_extension.py',
  check: 'skills/chrome-extension-builder/scripts/check_extension.py',
  package: 'skills/chrome-extension-builder/scripts/package_extension.py',
  session: 'skills/chrome-extension-builder/scripts/session.py',
  intelligence: 'skills/chrome-extension-builder/scripts/intelligence.py',
};
export function version(root) {
  for (const name of ['plugin.json', '.codex-plugin/plugin.json', '.claude-plugin/plugin.json', '.cursor-plugin/plugin.json', 'gemini-extension.json', 'package.json']) {
    const path = resolve(root, name);
    if (existsSync(path)) {
      const value = JSON.parse(readFileSync(path, 'utf8')).version;
      if (!/^\d+\.\d+\.\d+$/.test(value)) throw new Error('Invalid version metadata');
      return value;
    }
  }
  throw new Error('Missing version metadata');
}
const failures = {
  RUNTIME_NOT_FOUND: ['Python 3.10+ is unavailable.', 'Use a host with Python 3.10+, or continue with a chat-only artifact. No tool was installed.'],
  RUNTIME_UNSUPPORTED: ['The runtime is unsupported.', 'Use Node 18+ and Python 3.10+; do not silently replace global tools.'],
  RESOURCE_MISSING: ['A required packaged resource is missing or invalid.', 'Reload or reinstall the complete native edition from its owning source.'],
  PROJECT_NOT_FOUND: ['The selected project directory does not exist.', 'Select the existing project directory; initialize only for a new project.'],
  PROJECT_NOT_INITIALIZED: ['The project has no initialized continuity record.', 'Preserve existing files and explicitly initialize the session or continuity identity if needed.'],
  FILE_NOT_FOUND: ['A selected input or evidence file is unavailable.', 'Check the project-relative file and preserve existing state before retrying.'],
  ACCESS_DENIED: ['Local access was denied.', 'Use an authorized accessible project or chat-only fallback; do not weaken host safeguards.'],
  PATH_REJECTED: ['The path violates the local artifact boundary.', 'Use a regular project-relative sanitized artifact; avoid credentials, backend files and symlinks.'],
  STATE_BUSY: ['Another writer is updating the project.', 'Wait for that command to finish, then read current state before deciding to retry.'],
  STATE_CONFLICT: ['The operation conflicts with current project identity or decisions.', 'Read the current project report and reconcile identity or decisions before writing.'],
  STATE_INVALID: ['The existing project record is invalid.', 'Preserve it and restore a reviewed valid checkpoint; do not overwrite or reinitialize it.'],
  EVIDENCE_STALE: ['Recorded evidence changed or became stale.', 'Inspect the current artifact and re-record affected evidence after verification.'],
  OUTPUT_EXISTS: ['The operation would overwrite an existing artifact.', 'Inspect existing output; use another destination or explicitly authorized replacement.'],
  INVALID_ARGUMENT: ['The operation arguments are invalid.', 'Read the selected command help and correct its arguments.'],
  INVALID_INPUT: ['The selected input is invalid.', 'Correct the bounded input without replacing existing project state.'],
  CHECK_FAILED: ['Local validation found an unresolved issue.', 'Inspect the structured findings, repair the affected artifact, and rerun the affected check.'],
  UNSUPPORTED_OPERATION: ['This operation has no bounded structured contract.', 'Use doctor for capabilities; start Studio manually with the legacy studio command.'],
  LOCAL_IO_FAILED: ['A local file operation failed.', 'Inspect the selected project and existing artifacts before another write.'],
  OUTCOME_UNKNOWN: ['The operation ended before a complete receipt was available.', 'Read current state and inspect output files before repeating; partial local writes may exist.'],
};
function classify(message) {
  if (/permission denied|access is denied|EACCES|EPERM/i.test(message)) return 'ACCESS_DENIED';
  if (/\[Errno (?:5|28|30)\]/i.test(message)) return 'LOCAL_IO_FAILED';
  if (/being updated/i.test(message)) return 'STATE_BUSY';
  if (/symlink|credential|private |safe relative|outside .*directory/i.test(message)) return 'PATH_REJECTED';
  if (/already exists|File exists|overwrite/i.test(message)) return 'OUTPUT_EXISTS';
  if (/does not exist/i.test(message)) return 'PROJECT_NOT_FOUND';
  if (/initialize this project|legacy project has no continuity/i.test(message)) return 'PROJECT_NOT_INITIALIZED';
  if (/No such file|ENOENT|regular file/i.test(message)) return 'FILE_NOT_FOUND';
  if (/invalid project state|stored |schema|out of sequence/i.test(message)) return 'STATE_INVALID';
  if (/project ID|identity|transferred|conflict/i.test(message)) return 'STATE_CONFLICT';
  if (/evidence (?:changed|is stale)/i.test(message)) return 'EVIDENCE_STALE';
  if (/usage:|unrecognized arguments|invalid choice|required:/i.test(message)) return 'INVALID_ARGUMENT';
  if (/invalid extension|validation/i.test(message)) return 'CHECK_FAILED';
  return 'INVALID_INPUT';
}
function receipt(root, operation, outputs = null, code = null, unknown = false) {
  let helperVersion; try { helperVersion = version(root); } catch { helperVersion = 'unknown'; code = 'RESOURCE_MISSING'; }
  const [message, next] = code ? failures[code] : ['', 'Inspect the useful artifact or current project and perform the requested next task.'];
  return { schema_version: 1, helper: 'chrome-extension-builder', helper_version: helperVersion, run_id: randomUUID(), operation,
    state: unknown ? 'unknown' : code ? (code === 'CHECK_FAILED' ? 'failed' : 'blocked') : 'completed',
    verification_level: unknown ? 'unknown-local-outcome' : ['check', 'package'].includes(operation) ? 'local-static-only' : ['session', 'intelligence'].includes(operation) ? 'local-record-only' : 'local-artifact-only',
    outputs, error: code ? { code, message } : null, next_action: next, safe_to_replay: false,
    browser_verified: false, store_published: false, scheduler_activated: false };
}
export function doctor(root) {
  const probe = spawnSync('python3', ['--version'], { encoding: 'utf8', timeout: 3000, maxBuffer: 4096 });
  const match = /^Python (\d+)\.(\d+)\.(\d+)/.exec(probe.stdout || probe.stderr || '');
  const pythonOk = probe.status === 0 && match && Number(match[1]) === 3 && Number(match[2]) >= 10;
  const nodeOk = Number(process.versions.node.split('.')[0]) >= 18;
  const commands = Object.entries(OPERATIONS).map(([command, file]) => ({ command, available: existsSync(resolve(root, file)), runtime: 'Python 3.10+', bounded_structured_execution: true }));
  const code = !match ? 'RUNTIME_NOT_FOUND' : !pythonOk || !nodeOk ? 'RUNTIME_UNSUPPORTED' : commands.some(c => !c.available) ? 'RESOURCE_MISSING' : null;
  return receipt(root, 'doctor', { node: process.versions.node, python: match ? match.slice(1).join('.') : null, commands, network_performed: false, browser_verification: 'requires a supported host; not provided by these helpers', max_duration_ms: 30000, max_output_bytes_per_stream: 8388608, max_arguments: 50 }, code);
}
export function execute(root, command, args, { timeoutMs = 30000 } = {}) {
  if (!Object.hasOwn(OPERATIONS, command)) return receipt(root, command, null, 'UNSUPPORTED_OPERATION');
  if (args.length > 50 || args.some(a => typeof a !== 'string' || a.length > 2000 || /[\u0000-\u001f]/.test(a)) || args.join('').length > 16000 || args.includes('--help') || args.includes('-h')) return receipt(root, command, null, 'INVALID_ARGUMENT');
  const preflight = doctor(root); if (preflight.error) return receipt(root, command, null, preflight.error.code);
  if (['session', 'intelligence'].includes(command) && args[1] && args[0] !== 'init' && args[0] !== 'examples' && !args[1].startsWith('--') && !existsSync(args[1])) return receipt(root, command, null, 'PROJECT_NOT_FOUND');
  const checkArgs = command === 'check' && !args.includes('--json') ? [...args, '--json'] : args;
  const child = spawnSync('python3', [resolve(root, OPERATIONS[command]), ...checkArgs], { encoding: 'utf8', timeout: Math.min(30000, Math.max(50, timeoutMs)), killSignal: 'SIGKILL', maxBuffer: 8388608 });
  if (child.error?.code === 'ENOENT') return receipt(root, command, null, 'RUNTIME_NOT_FOUND');
  if (['ETIMEDOUT', 'ENOBUFS'].includes(child.error?.code) || child.signal) return receipt(root, command, null, 'OUTCOME_UNKNOWN', true);
  if (child.error) return receipt(root, command, null, child.error.code === 'EACCES' ? 'ACCESS_DENIED' : 'LOCAL_IO_FAILED');
  let output; try { output = JSON.parse(child.stdout); } catch { output = null; }
  if (child.status !== 0) {
    const code = command === 'check' && output ? 'CHECK_FAILED' : classify(child.stderr);
    const result = receipt(root, command, output, code);
    const writes = command === 'scaffold' || command === 'package' || (command === 'session' && args[0] !== 'status') || (command === 'intelligence' && !['show', 'jobs', 'examples'].includes(args[0]));
    if (writes && ['ACCESS_DENIED', 'LOCAL_IO_FAILED'].includes(code)) {
      result.state = 'partial'; result.verification_level = 'unknown-local-outcome';
      result.next_action = 'Preserve and inspect any partial files and current project state before repeating a write.';
    }
    return result;
  }
  if (output === null) return receipt(root, command, null, 'OUTCOME_UNKNOWN', true);
  return receipt(root, command, output);
}
