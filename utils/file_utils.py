import os
import shutil

def ensure_dir(path):
    """Ensure a directory exists."""
    os.makedirs(path, exist_ok=True)


def remove_file(path):
    """Remove a file if it exists."""
    if os.path.exists(path):
        os.remove(path)


def move_file(src, dst):
    """Move a file from src to dst."""
    shutil.move(src, dst)


def get_file_size(path):
    """Get file size in bytes."""
    if os.path.exists(path):
        return os.path.getsize(path)
    return 0


def allowed_file(filename, allowed_extensions=None):
    """Check if a file has an allowed extension."""
    if allowed_extensions is None:
        allowed_extensions = {'png', 'jpg', 'jpeg', 'gif'}
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed_extensions
