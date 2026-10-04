"""Project boundaries shared by session and intelligence tools."""
from pathlib import Path
from check_extension import CREDENTIAL_PARTS, sensitive_file
from tool_paths import relative_file, safe_path


def project_root(value: Path) -> Path:
    root = safe_path(value)
    if any(part.lower() in CREDENTIAL_PARTS or part.lower() in {'.env', '.dev.vars'} or part.lower().startswith(('.env.', '.dev.vars.')) for part in root.parts):
        raise ValueError('credential directories and their descendants cannot be project roots')
    return root


def guarded_artifact(root: Path, value: str, *, state_ok=False, require_file=True) -> Path:
    root = project_root(root)
    path = relative_file(root, value)
    relative = path.relative_to(root)
    state_pointer = relative.as_posix() == '.extension-builder/project.json'
    if sensitive_file(relative) or any(p.lower() in {'.git', '.ssh', 'node_modules'} for p in relative.parts) or ('.extension-builder' in relative.parts and not (state_ok and state_pointer)):
        raise ValueError('private credential, backend and metadata files are not accepted as project artifacts')
    if require_file and not path.is_file():
        raise ValueError('artifact must be a regular file inside the project')
    return path
