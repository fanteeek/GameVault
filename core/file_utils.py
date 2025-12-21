import re
import sys
import os
from pathlib import Path

class FileUtils:
    @staticmethod
    def sanitize_name(name: str) -> str:
        return re.sub(r'[\\/*?:"<>|]', "", name)
    
    @staticmethod
    def get_folder_size(paths: list[str]) -> int:
        total_size = 0
        if not paths: return 0
        for path_str in paths:
            path = Path(path_str)
            if not path.exists(): continue
            
            if path.is_file():
                total_size += path.stat().st_size
            else:
                for file in path.rglob('*'):
                    if file.is_file():
                        try:
                            total_size += file.stat().st_size
                        except (PermissionError, FileNotFoundError):
                            continue
        return total_size

    @staticmethod
    def format_size(size_bytes: int) -> str:
        for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
            if size_bytes < 1024:
                return f"{size_bytes:.2f} {unit}"
            size_bytes /= 1024
        return f"{size_bytes:.2f} TB"

    @staticmethod
    def get_backups_list(backup_root: str, game_name: str) -> list[dict]:
        safe_name = FileUtils.sanitize_name(game_name)
        backup_path = Path(backup_root) / safe_name
        
        if not backup_path.exists(): return []
    

        backups = []
        for file in backup_path.glob("*.zip"):
            stats = file.stat()
            backups.append({
                "name": file.name,
                "path": str(file),
                "size": FileUtils.format_size(stats.st_size),
                "date": Path(file).stat().st_mtime
            })
        return sorted(backups, key=lambda x: x['date'], reverse=True)
    
    @staticmethod
    def get_resource_path(relative_path):
        if hasattr(sys, '_MEIPASS'):
            return Path(sys._MEIPASS) / relative_path
        return Path(os.path.abspath(".")) / relative_path

    @staticmethod
    def get_app_dir():
        if hasattr(sys, 'frozen'):
            return Path(sys.executable).parent
        return Path(os.path.abspath("."))
    
    @staticmethod
    def cleanup_installer():
        installer_path = FileUtils.get_app_dir() / "GameVault_Setup.exe"
        if installer_path.exists():
            try:
                os.remove(installer_path)
                print("Временный файл инсталлятора удален.")
            except Exception as e:
                print(f"Не удалось удалить инсталлятор: {e}")