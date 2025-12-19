import re
from pathlib import Path

class FileUtils:
    @staticmethod
    def sanitize_name(name: str) -> str:
        """Удаляет символы, запрещенные в именах файлов Windows."""
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
        """Возвращает список существующих zip-архивов для конкретной игры."""
        # Санитизируем имя игры перед поиском папки
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
                "date": Path(file).stat().st_mtime # Передадим timestamp
            })
        # Сортируем: сначала новые
        return sorted(backups, key=lambda x: x['date'], reverse=True)