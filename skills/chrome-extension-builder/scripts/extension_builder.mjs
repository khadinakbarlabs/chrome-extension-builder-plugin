#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const [command, ...args] = process.argv.slice(2);
const tools = {
  scaffold: ['skills/chrome-extension-builder/scripts/scaffold_extension.py'],
  check: ['skills/chrome-extension-builder/scripts/check_extension.py'],
  package: ['skills/chrome-extension-builder/scripts/package_extension.py'],
  session: ['skills/chrome-extension-builder/scripts/session.py'],
  studio: ['scripts/serve_studio.py'],
  'validate-plugin': ['scripts/release_plugin.py', 'validate'],
  bundle: ['scripts/release_plugin.py', 'bundle'],
};
if (!command || ['help', '--help', '-h'].includes(command)) {
  console.log(`Chrome Extension Builder\n\nUsage: chrome-extension-builder <command> [options]\n\n  studio           Open a local interactive planning workspace\n  scaffold         Generate a working Manifest V3 starter\n  check            Inspect an extension build directory\n  package          Validate and ZIP an extension build directory\n  session          Initialize, inspect, or advance an evidence-backed project\n  validate-plugin  Validate this plugin's source and references\n  bundle           Build isolated archives from the full source checkout\n\nRun any command with --help for options. Requires Node.js and Python 3.10+.\nStudio prints a loopback URL; open it in a browser. No account or cloud service is needed.`);
} else if (command === '--version') {
  const { readFile } = await import('node:fs/promises');
  let version;
  for (const path of ['plugin.json', '.codex-plugin/plugin.json', '.claude-plugin/plugin.json', '.cursor-plugin/plugin.json', 'gemini-extension.json', 'package.json']) {
    try {
      version = JSON.parse(await readFile(resolve(root, path), 'utf8')).version;
      if (!version) throw new Error(`Missing version in ${path}`);
      break;
    } catch (error) {
      if (error.code !== 'ENOENT') throw new Error(`Cannot read version metadata in ${path}: ${error.message}`);
    }
  }
  if (!version) throw new Error('No plugin version metadata found.');
  console.log(version);
} else if (!Object.hasOwn(tools, command)) {
  console.error(`Unknown command: ${command}. Use --help.`);
  process.exitCode = 2;
} else {
  const [script, ...prefix] = tools[command];
  const child = spawn('python3', [resolve(root, script), ...prefix, ...args], { stdio: 'inherit' });
  child.on('error', error => { console.error(`Could not start Python 3: ${error.message}`); process.exitCode = 1; });
  child.on('exit', (code, signal) => { process.exitCode = code ?? (signal === 'SIGINT' ? 130 : 1); });
  const forward = () => child.kill('SIGINT');
  process.on('SIGINT', forward);
  child.on('close', () => process.removeListener('SIGINT', forward));
}
