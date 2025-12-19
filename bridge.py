import sys
import os
import webview
import threading

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
                self._window.evaluate_js(f"onBackupComplete('Error: {str(e)}')")

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
            selected_path = result[0]
            # Добавляем в настройки через ConfigService
            current_paths = self._config.get("non_steam_paths", [])
            if selected_path not in current_paths:
                current_paths.append(selected_path)
                self._config.set("non_steam_paths", current_paths)
                return {"status": "success", "path": selected_path}
        
        return {"status": "cancelled"}
    