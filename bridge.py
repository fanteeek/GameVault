from pathlib import Path
import sys
import os
import webview
import threading
import json

from core.backup_service import BackupService

class Bridge:
    def __init__(self):
        from core.config import ConfigService
        from core.resolver import PathResolver
        from core.scanner import GameScanner
        from core.steam import SteamService

        self._config = ConfigService()
        self._steam = SteamService()
        self._resolver = PathResolver(self._steam)
        self._scanner = GameScanner(self._steam, self._config, self._resolver)
        self._window = None

    def set_window(self, window):
        self._window = window

    def get_games(self):
        return self._scanner.scan_all()

    def close_window(self):
        self._window.destroy()
        sys.exit()

    def minimize_window(self):
        self._window.minimize()
        
    def start_backup(self, game_id: str):
        # 1. Находим данные игры
        games = self._scanner.scan_all()
        game = next((g for g in games if str(g['id']) == str(game_id)), None)
        
        if not game or not game['save_paths']:
            return {"status": "error", "message": "Paths not found"}

        # 2. Функция, которая будет вызываться из Python и "стучаться" в JS
        def on_progress(percent):
            # window.evaluate_js позволяет запустить любой JS код в окне
            self._window.evaluate_js(f"updateUIProgress({percent})")

        # 3. Запускаем в отдельном потоке, чтобы не тормозить UI
        def worker():
            try:
                result_path = BackupService.create_zip(
                    game['name'],
                    game['save_paths'],
                    self._config.get("backup_root"),
                    on_progress
                )
                self._window.evaluate_js(f"onBackupComplete('{result_path}')")
            except Exception as e:
                error_msg = json.dumps(str(e))
                self._window.evaluate_js(f"onBackupComplete({error_msg})")

        threading.Thread(target=worker, daemon=True).start()
        return {"status": "started"}
    
    def open_folder(self, path: str):
        """Открывает папку в проводнике Windows."""
        if path and os.path.exists(path):
            os.startfile(path)
            return True
        return False
    
    def select_folder(self):
        """Открывает диалог выбора папки и добавляет её в настройки."""
        # Вызываем системный диалог выбора папки
        result = self._window.create_file_dialog(webview.FileDialog.FOLDER)
        
        if result:
            selected_path = os.path.normpath(result[0])
            # Добавляем в настройки через ConfigService
            current_paths = self._config.get("non_steam_paths", [])
            
            if not any(os.path.normpath(p).lower() == selected_path.lower() for p in current_paths):
                current_paths.append(selected_path)
                self._config.set("non_steam_paths", current_paths)
                return {"status": "success", "path": selected_path}
        
        return {"status": "cancelled"}
    
    def get_game_details(self, game_id: str):
        """Возвращает размер сохранений и список бэкапов."""
        games = self._scanner.scan_all()
        game = next((g for g in games if str(g['id']) == str(game_id)), None)
        
        if not game: return None

        from core.file_utils import FileUtils
        size_bytes = FileUtils.get_folder_size(game['save_paths'])
        backups = FileUtils.get_backups_list(self._config.get("backup_root"), game['name'])

        return {
            "size": FileUtils.format_size(size_bytes),
            "backups": backups
        }

    def open_backup_folder(self, game_name: str):
        from core.file_utils import FileUtils
        safe_name = FileUtils.sanitize_name(game_name)
        
        path = Path(self._config.get("backup_root")) / safe_name
        if not path.exists():
            path = Path(self._config.get("backup_root"))
            
        if path.exists():
            os.startfile(str(path))
            
    def delete_backup(self, file_path: str):
        try:
            path = Path(file_path)
            if path.exists() and path.suffix == '.zip':
                path.unlink() # Удаляет файл
                return True
        except Exception as e:
            print(f"Delete error: {e}")
        return False
    
    def remove_folder(self, path: str):
        current = self._config.get("non_steam_paths", [])
        target_path = os.path.normpath(path)
        new_paths = [
            p for p in current
            if os.path.normpath(p).lower() != target_path.lower()
        ]
        
        if len(new_paths) < len(current):
            self._config.set("non_steam_paths", new_paths)
            return True
        
        return False

    def get_settings(self):
        return {
            "non_steam_paths": self._config.get("non_steam_paths", []),
            "backup_root": self._config.get("backup_root")
        }

  
    