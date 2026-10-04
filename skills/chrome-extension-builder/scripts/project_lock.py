"""Serialize local writers to the shared project record without removing lock files."""
from contextlib import contextmanager
import os
import stat
from pathlib import Path
from tool_paths import safe_path
from project_guard import project_root


@contextmanager
def project_lock(root: Path, *, create=False):
    root = project_root(root)
    if create:
        root.mkdir(parents=True, exist_ok=True)
    if not root.is_dir():
        raise ValueError('project directory does not exist; initialize the session first')
    directory = safe_path(root / '.extension-builder')
    directory.mkdir(exist_ok=True)
    path = safe_path(directory / '.state.lock')
    flags = os.O_CREAT | os.O_RDWR | getattr(os, 'O_NOFOLLOW', 0)
    descriptor = os.open(path, flags, 0o600)
    try:
        if not stat.S_ISREG(os.fstat(descriptor).st_mode):
            raise ValueError('project lock must be a regular file')
        if os.name == 'nt':
            import msvcrt
            if os.fstat(descriptor).st_size == 0:
                os.write(descriptor, b'\0')
            os.lseek(descriptor, 0, os.SEEK_SET)
            try:
                msvcrt.locking(descriptor, msvcrt.LK_NBLCK, 1)
            except OSError as exc:
                raise ValueError('project state is being updated; retry after that command finishes') from exc
        else:
            import fcntl
            try:
                fcntl.flock(descriptor, fcntl.LOCK_EX | fcntl.LOCK_NB)
            except OSError as exc:
                raise ValueError('project state is being updated; retry after that command finishes') from exc
        yield
    finally:
        os.close(descriptor)
