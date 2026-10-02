"""Shared local filesystem safeguards for builder tools."""
from pathlib import Path


def safe_path(value: Path) -> Path:
    """Reject symlinks in every existing path component before resolving."""
    path = value.expanduser().absolute()
    # macOS exposes canonical system directories through these fixed aliases.
    system_aliases = {'/var': '/private/var', '/tmp': '/private/tmp', '/etc': '/private/etc'}
    for candidate in (path, *path.parents):
        if str(candidate) in system_aliases and str(candidate.resolve()) == system_aliases[str(candidate)]:
            continue
        if candidate.is_symlink():
            raise ValueError(f'symlink is not allowed: {candidate}')
    return path.resolve()


def relative_file(root: Path, value: str) -> Path:
    relative = Path(value)
    if not value or relative.is_absolute() or '..' in relative.parts or '\\' in value:
        raise ValueError(f'expected a safe relative file path: {value}')
    path = safe_path(root / relative)
    path.relative_to(root)
    return path
