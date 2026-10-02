#!/usr/bin/env python3
"""Serve the packaged planning studio read-only on loopback."""
import argparse
import mimetypes
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1] / 'studio'


def safe_target(root, request_path):
    path = unquote(urlsplit(request_path).path)
    if '\x00' in path or '\\' in path or '..' in path.split('/'):
        return None
    relative = path.lstrip('/') or 'index.html'
    target = root / relative
    boundary_paths = [root / Path(*Path(relative).parts[:index]) for index in range(1, len(Path(relative).parts) + 1)]
    if root.is_symlink() or any(item.is_symlink() for item in boundary_paths):
        return None
    try:
        target.resolve().relative_to(root.resolve())
    except ValueError:
        return None
    return target if target.is_file() else None


class StudioHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        host = self.headers.get('Host', '')
        if host != f'127.0.0.1:{self.server.server_port}':
            self.send_error(403, 'Loopback host required')
            return
        target = safe_target(ROOT, self.path)
        if target is None:
            self.send_error(404)
            return
        data = target.read_bytes()
        self.send_response(200)
        content_type = mimetypes.guess_type(str(target))[0] or 'application/octet-stream'
        if target.suffix == '.mjs':
            content_type = 'text/javascript'
        self.send_header('Content-Type', content_type)
        self.send_header('Content-Length', str(len(data)))
        self.send_header('Cache-Control', 'no-store')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('Referrer-Policy', 'no-referrer')
        self.send_header('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'")
        self.end_headers()
        if self.command != 'HEAD':
            self.wfile.write(data)

    do_HEAD = do_GET

    def log_message(self, format, *args):
        pass


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--port', type=int, default=4318, help='Stable default preserves browser storage; use 0 for a temporary random port')
    args = parser.parse_args()
    if not 0 <= args.port <= 65535:
        parser.error('port must be between 0 and 65535')
    try:
        server = ThreadingHTTPServer(('127.0.0.1', args.port), StudioHandler)
    except OSError as exc:
        parser.exit(1, f'Cannot open studio port {args.port}: {exc}. Choose --port with a free port; use that same port to resume remembered browser plans.\n')
    with server:
        print(f'Extension Studio: http://127.0.0.1:{server.server_port}', flush=True)
        print('Local planning workspace. Press Ctrl+C to stop.', flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass


if __name__ == '__main__':
    main()
