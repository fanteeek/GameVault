import zipfile
import datetime
from pathlib import Path
from typing import List, Callable

from core.file_utils import FileUtils

class BackupService:
    @staticmethod
    def create_zip(game_name: str, source_paths: List[str], destination_root: str, progress_callback: Callable[[float], None]) -> str:
        safe_name = FileUtils.sanitize_name(game_name)
        
        dest_dir = Path(destination_root) / safe_name
        dest_dir.mkdir(parents=True, exist_ok=True)

        timestamp = datetime.datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
        zip_name = f"{safe_name}_{timestamp}.zip" # ИСПОЛЬЗУЕМ safe_name
        zip_path = dest_dir / zip_name

        files_to_add = []
        for path_str in source_paths:
            p = Path(path_str)
            if p.exists():
                if p.is_file():
                    files_to_add.append((p, p.name))
                else:
                    for file in p.rglob('*'):
                        if file.is_file():
                            files_to_add.append((file, file.relative_to(p.parent)))

        if not files_to_add:
            return "No files found"

        total_files = len(files_to_add)
        
        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for i, (file_path, arc_name) in enumerate(files_to_add):
                zipf.write(file_path, arcname=arc_name)
                progress = ((i + 1) / total_files) * 100
                progress_callback(progress)

        return str(zip_path)