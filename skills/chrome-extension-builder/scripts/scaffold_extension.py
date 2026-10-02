#!/usr/bin/env python3
"""Create a polished, functional local notes starter for Manifest V3."""
from __future__ import annotations
import argparse
import html
import json
import re
import struct
import zlib
from pathlib import Path
from urllib.parse import urlsplit
from tool_paths import safe_path


def parse_args():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--name', required=True)
    parser.add_argument('--purpose', required=True)
    parser.add_argument('--output', required=True, type=Path)
    for flag in ('popup', 'service-worker', 'content-script', 'side-panel', 'options', 'force'):
        parser.add_argument('--' + flag, action='store_true')
    parser.add_argument('--match', action='append', default=[], help='exact HTTP(S) host match, e.g. https://example.com/*')
    parser.add_argument('--api-origin', help='HTTPS API origin; enables an explicit /health probe, not auth or sync')
    return parser.parse_args()


def slug(value):
    result = re.sub(r'[^a-z0-9]+', '-', value.lower()).strip('-')
    if not result: raise ValueError('name must contain at least one letter or number')
    return result[:50]


def png_icon(size):
    rows = []
    for y in range(size):
        row = bytearray()
        for x in range(size):
            ink = size * .28 < x < size * .72 and size * .25 < y < size * .75
            line = ink and (abs(y-size*.42) < size*.035 or abs(y-size*.58) < size*.035)
            row.extend((235, 246, 242, 255) if ink and not line else (40, 100, 85, 255))
        rows.append(b'\0' + bytes(row))
    def chunk(kind, content): return struct.pack('!I', len(content)) + kind + content + struct.pack('!I', zlib.crc32(kind + content) & 0xffffffff)
    return b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('!IIBBBBB', size, size, 8, 6, 0, 0, 0)) + chunk(b'IDAT', zlib.compress(b''.join(rows))) + chunk(b'IEND', b'')


CSS = '''
:root{color-scheme:light dark;--bg:#f4f5f0;--card:#ffffff;--text:#1f302a;--muted:#5c6d63;--line:#d9e2d9;--accent:#286455;--on-accent:#fff;--tint:#eaf2ed;--danger:#a53336;font:15px/1.5 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
:root[data-theme="dark"]{--bg:#141e1a;--card:#1e2b25;--text:#eef5ee;--muted:#acbcb0;--line:#3b4d41;--accent:#96d1b1;--on-accent:#14261a;--tint:#293b30;--danger:#ffa4a6;color-scheme:dark}
@media(prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#141e1a;--card:#1e2b25;--text:#eef5ee;--muted:#acbcb0;--line:#3b4d41;--accent:#96d1b1;--on-accent:#14261a;--tint:#293b30;--danger:#ffa4a6}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text)}body[data-surface="popup"]{width:380px;min-height:480px}main{max-width:680px;margin:auto;padding:22px}header{display:flex;justify-content:space-between;gap:12px;align-items:center;margin-bottom:22px}.brand{display:flex;align-items:center;gap:12px}.brand img{border-radius:12px;width:42px;height:42px}h1{font-size:21px;line-height:1.2;letter-spacing:-.6px;margin:0}.eyebrow{color:var(--accent);font-size:11px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;margin:0 0 5px}.intro{color:var(--muted);margin:0 0 16px}h2{font-size:16px;margin:0}button,input,textarea,select{font:inherit}button{cursor:pointer;border:1px solid var(--line);border-radius:10px;padding:10px 13px;background:var(--card);color:var(--text);font-weight:600;min-height:42px}button:hover{background:var(--tint)}button.primary{background:var(--accent);border-color:var(--accent);color:var(--on-accent)}button:disabled{cursor:wait;opacity:.65}:focus-visible{outline:3px solid var(--accent);outline-offset:3px}label{display:block;font-weight:600;font-size:13px;margin-bottom:7px}textarea,input,select{width:100%;border:1px solid var(--line);border-radius:10px;padding:11px 12px;color:var(--text);background:var(--card)}textarea{min-height:115px;resize:vertical}form{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:17px;box-shadow:0 4px 14px #102d1710}.row{display:flex;gap:10px;align-items:center;justify-content:space-between}.meta{font-size:12px;color:var(--muted)}form .row{margin-top:12px}#status{min-height:24px;font-size:13px;margin:12px 0;color:var(--muted)}#status[data-tone="error"]{color:var(--danger)}.section-head{margin:12px 0}.section-head h2{display:flex;gap:8px;align-items:center}.count{border-radius:20px;padding:2px 7px;background:var(--tint);font-size:12px;color:var(--accent)}#search{margin:0 0 12px;padding:9px 12px}ul{list-style:none;margin:0;padding:0;display:grid;gap:10px}.note{border:1px solid var(--line);background:var(--card);border-radius:12px;padding:13px}.note p{white-space:pre-wrap;overflow-wrap:anywhere;margin:0 0 9px}.note footer{display:flex;justify-content:space-between;align-items:center;gap:8px}.delete{font-size:12px;padding:4px 10px;min-height:34px;color:var(--danger)}.empty{border:1px dashed var(--line);border-radius:14px;padding:24px 16px;text-align:center;color:var(--muted)}.empty strong{display:block;color:var(--text);margin-bottom:5px}.settings{margin-top:18px;border:1px solid var(--line);border-radius:14px;padding:16px}.settings label{margin-top:12px}.settings p{color:var(--muted);font-size:13px}.settings button{margin-top:10px}.cloud{margin-top:18px;border:1px solid var(--line);border-radius:14px;padding:16px}.cloud p{font-size:13px;color:var(--muted)}.bottom{margin-top:20px;display:flex;gap:8px;justify-content:space-between;align-items:center;font-size:12px;color:var(--muted)}[hidden]{display:none!important}@media(max-width:340px){main{padding:14px}.brand img{width:32px;height:32px}h1{font-size:18px}}@media(prefers-reduced-motion:no-preference){button{transition:background .15s ease}}
'''

APP_JS = '''
import { API_ORIGIN } from './config.js';
const $ = (selector) => document.querySelector(selector);
const status = $('#status');
let notes = [];
let preferences = { theme: 'system' };
const report = (message, tone = 'normal') => { status.textContent = message; status.dataset.tone = tone; };
const theme = () => {
  if (preferences.theme === 'system') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.dataset.theme = preferences.theme;
  $('#theme').value = preferences.theme;
};
const render = () => {
  const query = $('#search').value.toLocaleLowerCase();
  const visible = notes.filter(note => note.text.toLocaleLowerCase().includes(query));
  $('#count').textContent = String(notes.length);
  const list = $('#notes'); list.replaceChildren();
  $('#empty').hidden = visible.length > 0;
  $('#empty-title').textContent = query ? 'No matching notes' : 'A little space for your thoughts';
  $('#empty-copy').textContent = query ? 'Try a different search.' : 'Save your first note above. It stays on this device.';
  for (const note of visible) {
    const item = document.createElement('li'); item.className = 'note';
    const text = document.createElement('p'); text.textContent = note.text;
    const footer = document.createElement('footer');
    const timestamp = document.createElement('time'); timestamp.className = 'meta';
    timestamp.dateTime = note.createdAt; timestamp.textContent = new Date(note.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
    const button = document.createElement('button'); button.type = 'button'; button.className = 'delete'; button.textContent = 'Delete'; button.setAttribute('aria-label', 'Delete note from ' + timestamp.textContent);
    button.addEventListener('click', async () => {
      button.disabled = true;
      try {
        const latest = await chrome.storage.local.get({ notes: [] });
        await chrome.storage.local.set({ notes: latest.notes.filter(value => value.id !== note.id) });
        report('Note deleted.');
        $('#search').focus();
      } catch { button.disabled = false; report('Could not delete this note. Please try again.', 'error'); }
    });
    footer.append(timestamp, button); item.append(text, footer); list.append(item);
  }
};
$('#note-form').addEventListener('submit', async event => {
  event.preventDefault(); const text = $('#note').value.trim();
  if (!text || text.length > 2000) { report('Enter a note between 1 and 2,000 characters.', 'error'); $('#note').focus(); return; }
  const save = $('#save'); save.disabled = true; save.textContent = 'Saving…';
  try {
    const latest = await chrome.storage.local.get({ notes: [] });
    if (latest.notes.length >= 500) throw new Error('limit');
    await chrome.storage.local.set({ notes: [{ id: crypto.randomUUID(), text, createdAt: new Date().toISOString() }, ...latest.notes] });
    $('#note').value = ''; $('#characters').textContent = '0 / 2,000'; report('Saved on this device.'); $('#note').focus();
  } catch (error) { report(error.message === 'limit' ? 'You have 500 notes. Delete a note to make space.' : 'Could not save. Your text is still here; try again.', 'error'); }
  finally { save.disabled = false; save.textContent = 'Save note'; }
});
$('#note').addEventListener('input', () => { $('#characters').textContent = $('#note').value.length.toLocaleString() + ' / 2,000'; });
$('#search').addEventListener('input', render);
$('#theme').addEventListener('change', async event => {
  const value = event.target.value;
  if (!['system', 'light', 'dark'].includes(value)) return;
  try { await chrome.storage.local.set({ preferences: { ...preferences, theme: value } }); report('Appearance saved.'); }
  catch { theme(); report('Could not save appearance. Try again.', 'error'); }
});
$('#appearance').addEventListener('click', () => { $('#settings').hidden = !$('#settings').hidden; if (!$('#settings').hidden) $('#theme').focus(); $('#appearance').setAttribute('aria-expanded', String(!$('#settings').hidden)); });
$('#settings-link')?.addEventListener('click', () => { chrome.runtime.openOptionsPage().catch(() => report('Could not open settings.', 'error')); });
$('#check-api')?.addEventListener('click', async () => {
  const button = $('#check-api'); button.disabled = true; report('Checking the configured API…');
  try {
    const response = await fetch(API_ORIGIN + '/health', { credentials: 'omit', redirect: 'error', signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error('unavailable');
    report('API responded. This starter does not implement accounts or cloud sync.');
  } catch { report('API health check failed. Local notes remain available. Implement the backend /health contract and review access.', 'error'); }
  finally { button.disabled = false; }
});
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local') return;
  if (changes.notes) { notes = cleanNotes(changes.notes.newValue); render(); }
  if (changes.preferences) { preferences = cleanPreferences(changes.preferences.newValue); theme(); }
});
function cleanNotes(value) {
  return Array.isArray(value) ? value.filter(item => item && typeof item.id === 'string' && typeof item.text === 'string' && item.text.length <= 2000 && typeof item.createdAt === 'string' && Number.isFinite(Date.parse(item.createdAt))).slice(0, 500) : [];
}
function cleanPreferences(value) { return { theme: ['system', 'light', 'dark'].includes(value?.theme) ? value.theme : 'system' }; }
async function initialize() {
  $('#save').disabled = true; report('Loading your notes…');
  try {
    const stored = await chrome.storage.local.get({ notes: [], preferences: { theme: 'system' } });
    notes = cleanNotes(stored.notes); preferences = cleanPreferences(stored.preferences); theme(); render(); report('Private by default. Saved on this device.'); $('#save').disabled = false;
  } catch { report('Storage is unavailable. Reopen the extension to try again.', 'error'); }
}
initialize();
'''

WORKER_JS = '''
chrome.runtime.onInstalled.addListener(() => {
  if (chrome.sidePanel && chrome.runtime.getManifest().side_panel) {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(error => console.warn('Side panel setup failed:', error.message));
  }
});
// Messages from page scripts are untrusted. Accept only the declared action from matched content scripts.
chrome.runtime.onMessage.addListener((message, sender, respond) => {
  if (sender.id !== chrome.runtime.id || !sender.tab || message?.type !== 'save-selection') return false;
  const matches = chrome.runtime.getManifest().content_scripts?.flatMap(entry => entry.matches) ?? [];
  let permitted = false;
  try {
    const url = new URL(sender.url);
    permitted = matches.some(pattern => {
      const match = pattern.match(/^(https?):\\/\\/([^/]+)(\\/.*)$/);
      if (!match || url.protocol !== match[1] + ':' || url.hostname !== match[2]) return false;
      const expression = match[3].split('*').map(part => part.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')).join('.*');
      return new RegExp('^' + expression + '$').test(url.pathname + url.search);
    });
  } catch { return false; }
  if (!permitted || typeof message.text !== 'string' || !message.text.trim() || message.text.length > 2000) { respond({ ok: false, error: 'invalid-selection' }); return false; }
  (async () => {
    try {
      const stored = await chrome.storage.local.get({ notes: [] });
      const notes = Array.isArray(stored.notes) ? stored.notes : [];
      if (notes.length >= 500) { respond({ ok: false, error: 'note-limit' }); return; }
      await chrome.storage.local.set({ notes: [{ id: crypto.randomUUID(), text: message.text.trim(), createdAt: new Date().toISOString() }, ...notes] });
      respond({ ok: true });
    } catch { respond({ ok: false, error: 'storage-unavailable' }); }
  })();
  return true;
});
'''
CONTENT_JS = '''
// A deliberate user gesture saves selected text only on reviewed, exact hosts.
document.addEventListener('keydown', async event => {
  if (!event.isTrusted || !event.altKey || !event.shiftKey || event.code !== 'KeyS' || event.repeat) return;
  if (event.target instanceof HTMLElement && (event.target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName))) return;
  const text = window.getSelection()?.toString().trim();
  if (!text || text.length > 2000) return;
  event.preventDefault();
  let message;
  try {
    const result = await chrome.runtime.sendMessage({ type: 'save-selection', text });
    message = result?.ok ? 'Selection saved to your notes.' : 'Selection could not be saved. Open the extension to check storage.';
  } catch { message = 'Extension is unavailable. Reload this page after reloading the extension.'; }
  const notice = document.createElement('div'); notice.className = 'extension-note-notice'; notice.setAttribute('role', 'status'); notice.textContent = message;
  document.documentElement.append(notice); setTimeout(() => notice.remove(), 4000);
});
'''


def page(name, purpose, surface, cloud, options):
    title = html.escape(name, quote=True)
    intro = html.escape(purpose)
    cloud_section = '<section class="cloud"><h2>Cloud connection</h2><p>Local notes work now. Accounts and synchronization need a backend implementation. This check sends no notes or credentials.</p><button id="check-api" type="button">Check API connection</button></section>' if cloud else ''
    options_link = '<button id="settings-link" type="button">Settings</button>' if options and surface != 'options' else ''
    return f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{title}</title><link rel="stylesheet" href="styles.css"></head>
<body data-surface="{surface}"><main><header><div class="brand"><img src="icons/icon-48.png" alt=""><div><p class="eyebrow">Your personal space</p><h1>{title}</h1></div></div><button id="appearance" type="button" aria-controls="settings" aria-expanded="{'true' if surface == 'options' else 'false'}" aria-label="Appearance settings">Aa</button></header>
<p class="intro">{intro}</p><form id="note-form"><label for="note">What's worth keeping?</label><textarea id="note" maxlength="2000" placeholder="An idea, a reminder, a useful snippet…" aria-describedby="characters"></textarea><div class="row"><span id="characters" class="meta">0 / 2,000</span><button class="primary" id="save" type="submit" disabled>Save note</button></div></form>
<p id="status" role="status" aria-live="polite">Loading your notes…</p><div class="row section-head"><h2>Saved notes <span class="count" id="count">0</span></h2></div><label class="meta" for="search">Search your notes</label><input id="search" type="search" placeholder="Find something you saved"><ul id="notes" aria-label="Saved notes"></ul><div class="empty" id="empty" hidden><strong id="empty-title"></strong><span id="empty-copy"></span></div>
<section id="settings" class="settings" {'hidden' if surface != 'options' else ''}><h2>Make it yours</h2><label for="theme">Appearance</label><select id="theme"><option value="system">Use device setting</option><option value="light">Light</option><option value="dark">Dark</option></select><p>Notes are stored in this browser profile. Removing the extension clears its local storage. No analytics are included.</p></section>{cloud_section}<footer class="bottom"><span>Local storage · Your device</span>{options_link}</footer></main><script type="module" src="app.js"></script></body></html>\n'''


def main():
    args = parse_args()
    try:
        label = args.name.strip(); project_slug = slug(label)
        if len(label) > 75: raise ValueError('name must be at most 75 characters')
        if not args.purpose.strip() or len(args.purpose.strip()) > 132: raise ValueError('purpose must be a non-empty Chrome description of at most 132 characters')
        if args.content_script and not args.match: raise ValueError('--content-script requires at least one exact --match https://example.com/*')
        if args.match and not args.content_script: raise ValueError('--match requires --content-script')
        for match in args.match:
            if not re.fullmatch(r'https?://(?:localhost|(?:[a-zA-Z0-9-]+\.)*[a-zA-Z0-9-]+)(?:/[^\s]*)', match) or '*' in urlsplit(match).netloc or '?' in urlsplit(match).netloc:
                raise ValueError('content script matches require an exact HTTP(S) host and path; wildcard hosts and <all_urls> are not allowed')
        args.match = [value.split('://', 1)[0].lower() + '://' + value.split('://', 1)[1].split('/', 1)[0].lower() + '/' + value.split('://', 1)[1].split('/', 1)[1] for value in args.match]
        origin = None
        if args.api_origin:
            parsed = urlsplit(args.api_origin)
            parsed.port  # urlsplit validates numeric ports and the 0..65535 bound on access.
            if parsed.scheme != 'https' or not parsed.hostname or parsed.username or parsed.password or parsed.path not in {'', '/'} or parsed.query or parsed.fragment or '*' in parsed.netloc:
                raise ValueError('--api-origin must be an HTTPS origin without credentials, path, query, or fragment')
            origin = args.api_origin.rstrip('/')
        root = safe_path(args.output)
        if root.exists() and not root.is_dir(): raise ValueError('output exists and is not a directory')
        popup = args.popup or not args.side_panel
        files: dict[str, str | bytes] = {'styles.css': CSS, 'app.js': APP_JS, 'config.js': 'export const API_ORIGIN = ' + json.dumps(origin) + ';\n'}
        manifest = {'manifest_version': 3, 'name': label, 'version': '0.1.0', 'description': args.purpose.strip(), 'permissions': ['storage'], 'icons': {str(size): f'icons/icon-{size}.png' for size in (16, 48, 128)}}
        for size in (16, 48, 128): files[f'icons/icon-{size}.png'] = png_icon(size)
        manifest['action'] = {'default_title': label}
        if popup:
            manifest['action']['default_popup'] = 'popup.html'
            files['popup.html'] = page(label, args.purpose.strip(), 'popup', origin, args.options)
        if args.side_panel:
            manifest['permissions'].append('sidePanel'); manifest['minimum_chrome_version'] = '116'
            manifest['side_panel'] = {'default_path': 'side-panel.html'}
            files['side-panel.html'] = page(label, args.purpose.strip(), 'side-panel', origin, args.options)
        if args.options:
            manifest['options_ui'] = {'page': 'options.html', 'open_in_tab': True}
            files['options.html'] = page(label, args.purpose.strip(), 'options', origin, False)
        if args.service_worker or args.side_panel or args.content_script:
            manifest['background'] = {'service_worker': 'service-worker.js', 'type': 'module'}
            files['service-worker.js'] = WORKER_JS
        if args.content_script:
            manifest['content_scripts'] = [{'matches': list(dict.fromkeys(args.match)), 'js': ['content-script.js'], 'css': ['content-script.css'], 'run_at': 'document_idle'}]
            files['content-script.js'] = CONTENT_JS
            files['content-script.css'] = '.extension-note-notice{position:fixed!important;bottom:20px!important;right:20px!important;z-index:2147483647!important;max-width:340px!important;background:#1f302a!important;color:#fff!important;border-radius:12px!important;padding:14px 18px!important;font:14px/1.5 system-ui!important;box-shadow:0 6px 24px #0003!important;pointer-events:none!important}\n'
        if origin: manifest['host_permissions'] = [origin + '/*']
        files['manifest.json'] = json.dumps(manifest, indent=2) + '\n'
        files['README.md'] = f'''# {label}

Purpose: {args.purpose.strip()}

This starter implements local notes: save, search, delete, light/dark appearance, and shared local storage across selected surfaces. It is a working example to adapt to your product's single purpose, not a completed implementation of an arbitrary description.

Load this directory unpacked at `chrome://extensions` with Developer mode enabled. Open the toolbar action {'or the side panel' if args.side_panel else ''}. Reload the extension after editing. Test storage persistence, keyboard navigation, errors and service-worker restart in a real Chrome session. Local checks do not prove Store acceptance.

{'On declared matches only, select text and press Alt+Shift+S to save it. The worker validates sender origin/path and text size. Reload those tabs after extension updates.' if args.content_script else 'No page access is requested.'}

{'Cloud adapter: user-initiated GET ' + origin + '/health, no credentials and no notes. Implement the backend separately and replace this health probe with a reviewed account/sync contract. No sign-in, billing or synchronization is implemented. Keep server keys and backend source outside this extension directory.' if origin else 'All notes stay in this browser profile. No analytics or network adapter is included.'}

Concurrent edits from multiple open surfaces use local storage read/write and may race. For production products with concurrent writers, serialize mutations through the worker or use a transactional store. The service worker persists data; it does not rely on a live global variable.

Run the plugin checker and packager against this directory. Review the final ZIP and privacy/permission disclosures before Store submission. Removing the extension clears local notes. Do not put secrets, certificates, .env files, or backend source here.
'''
        targets = {relative: safe_path(root / relative) for relative in files}
        for relative, target in targets.items():
            if target.exists() and (not args.force or not target.is_file()): raise ValueError(f'refusing to overwrite existing file: {relative}; --force overwrites generated files only')
        root.mkdir(parents=True, exist_ok=True)
        for relative, content in files.items():
            path = targets[relative]; path.parent.mkdir(parents=True, exist_ok=True)
            if isinstance(content, bytes): path.write_bytes(content)
            else: path.write_text(content, encoding='utf-8')
        print(json.dumps({'output': str(root), 'files': sorted(files), 'slug': project_slug, 'implemented': ['local notes', 'search', 'delete', 'appearance', 'storage states'], 'cloud': 'health-probe-only' if origin else 'not-requested', 'browser_verified': False, 'store_published': False}, indent=2))
    except (OSError, ValueError) as exc: raise SystemExit(str(exc))


if __name__ == '__main__': main()
