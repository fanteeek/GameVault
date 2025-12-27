from pathlib import Path
import sys
import os
import time
import webview
import threading
import json
import logging

from core.backup_service import BackupService
from core.file_utils import FileUtils
from core.launcher import LauncherService
from core.updater import UpdaterService

class Bridge:
    VERSION = "0.0.8"
    
    def __init__(self):
        from core.config import ConfigService
        from core.resolver import PathResolver
        from core.scanner import GameScanner
        from core.steam import SteamService
        from core.cache_service import CacheService

        self._config = ConfigService()
        self._cache = CacheService()
        self._steam = SteamService()
        self._resolver = PathResolver(self._steam)
        self._scanner = GameScanner(self._steam, self._config, self._resolver)
        self._window = None
        self._is_maximized = False
        
        self._launcher = None
    
    def get_app_version(self):
        return self.VERSION
    
    def check_updates(self):
        try:
            return UpdaterService.check_for_updates(self.VERSION)
        except Exception as e:
            print(f"Ошибка проверки обновления: {e}")
            return {
                "update_avaliable": False,
                "error": str(e),
                "is_network_error": True
            }
    
    def start_update(self, url):
        logging.info(f"Staring update from URL: {url}")
        
        def progress(percent):
            currect_percent = int(percent)
            logging.debug(f"Download progress: {currect_percent}%")
            self._window.evaluate_js(f"UI.updateDownloadProgress({currect_percent})")
        
        def run_process():
            try:
                success = UpdaterService.install_update(url, progress)
                if success:
                    logging.info("Update installed, exiting...")
                    os._exit(0)
                else:
                    logging.error("Update failed in UpdaterService")
                    self._window.evaluate_js(f"UI.resetUpdateUI('Ошибка при запуске обновления')")
            except Exception as e:
                logging.exception("Exception in update thread:")
                self._window.evaluate_js(f"UI.resetUpdateUI('Ошибка: {str(e)}')")
                  
        thread = threading.Thread(target=run_process, daemon=True)
        thread.start()
    
    # Window Controls
    def simple_restore(self):
        if self._is_maximized:
            self._window.restore()
            self._is_maximized = False
            return True
        return False
    
    def toggle_maximize(self):
        if self._window:
            if self._is_maximized:
                self._window.restore()
                self._is_maximized = False
            else:
                self._window.maximize()
                self._is_maximized = True
            return self._is_maximized
    
    def set_window(self, window):
        self._window = window
        self._launcher = LauncherService(window)
        
    def get_maximize_status(self):
        return self._is_maximized
    
    def close_window(self):
        self._window.destroy()
        sys.exit()

    def minimize_window(self):
        self._window.minimize()
    
    def resize_window(self, width: int, height: int):
        if self._window:
            self._window.resize(width, height)
    
    def get_dashboard_data(self):
        backup_root = self._config.get("backup_root")
        games = self._scanner.scan_all()
        
        total_size_bytes = 0
        all_backups = []
        
        path = Path(backup_root)
        if path.exists():
            for file in path.rglob('*.zip'):
                stats = file.stat()
                total_size_bytes += stats.st_size
                all_backups.append({
                    "name": file.name,
                    "game": file.parent.name,
                    "size": FileUtils.format_size(stats.st_size),
                    "date": stats.st_mtime
                })

        recent_activity = sorted(all_backups, key=lambda x: x['date'], reverse=True)[:5]

        carousel_games = []
        for g in games:
            carousel_games.append({
                "id": g['id'],
                "steam_id": g.get('steam_id'),
                "name": g['name']
            })

        try:
            user_name = os.getlogin()
        except:
            user_name = os.environ.get('USERNAME', 'Пользователь')
        
        return {
            "user_name": user_name,
            "total_games": len(games),
            "total_size": FileUtils.format_size(total_size_bytes),
            "recent_activity": recent_activity,
            "carousel_games": carousel_games * 2
        }
    
    # Backup Logic
    def start_backup(self, game_id: str):
        games = self._scanner.scan_all()
        game = next((g for g in games if str(g['id']) == str(game_id)), None)
        
        if not game or not game['save_paths']:
            return {"status": "error", "message": "Paths not found"}

        def on_progress(percent):
            self._window.evaluate_js(f"UI.updateUIProgress({percent})")

        def worker():
            try:
                result_path = BackupService.create_zip(
                    game['name'],
                    game['save_paths'],
                    self._config.get("backup_root"),
                    on_progress
                )
                self._window.evaluate_js(f"UI.onBackupComplete('{result_path}')")
            except Exception as e:
                error_msg = json.dumps(str(e))
                self._window.evaluate_js(f"UI.onBackupComplete({error_msg})")

        threading.Thread(target=worker, daemon=True).start()
        return {"status": "started"}
    
    def open_folder(self, path: str):
        if path and os.path.exists(path):
            os.startfile(path)
            return True
        return False
    
    def select_folder(self):
        result = self._window.create_file_dialog(webview.FileDialog.FOLDER)
        
        if result:
            selected_path = os.path.normpath(result[0])
            current_paths = self._config.get("non_steam_paths", [])
            
            if not any(os.path.normpath(p).lower() == selected_path.lower() for p in current_paths):
                current_paths.append(selected_path)
                self._config.set("non_steam_paths", current_paths)
                return True
        
        return False
    
    def get_games(self):
        self._cached_games = self._scanner.scan_all()
        
        for game in self._cached_games:
            game_id = str(game['id'])
            b64_icon = self._cache.get_base64('icon', game_id)
            if b64_icon:
                game['local_icon'] = b64_icon
        
        threading.Thread(target=self._load_missing_icons_async, daemon=True).start()
        
        return self._cached_games
    
    def get_game_assets(self, game_id: str, steam_id: str):
        print(f"[Bridge] requesting assets for Game: {game_id}, SteamID: {steam_id}")
        hero_result = self._cache.get_base64('hero', game_id)
        logo_result = self._cache.get_base64('logo', game_id)

        hero_url = ""
        logo_url = ""
        
        if steam_id and str(steam_id) != "None":
            hero_url = f"https://cdn.cloudflare.steamstatic.com/steam/apps/{steam_id}/library_hero.jpg"
            logo_url = f"https://cdn.cloudflare.steamstatic.com/steam/apps/{steam_id}/logo.png"
        
        if not hero_result and hero_url:
            hero_result = hero_url
            threading.Thread(target=self._download_single_asset, args=('hero', game_id, hero_url), daemon=True).start()
        
        if not logo_result and logo_url:
            logo_result = logo_url
            threading.Thread(target=self._download_single_asset, args=('logo', game_id, logo_url), daemon=True).start()
            
        return {
            "hero": hero_result,
            "logo": logo_result
        }
    
    def _download_single_asset(self, category, game_id, url):
        if not self._cache.has_cached(category, game_id):
            print(f"[Cache] Background downloading {category} for {game_id}...")
            self._cache.save_from_url(category, game_id, url)
                    
    def _load_missing_icons_async(self):
        games_to_scan = list(self._cached_games)

        for game in games_to_scan:
            game_id = str(game['id'])
            
            if not self._cache.has_cached('icon', game_id):
                icon_bytes = self._scanner.extract_icon_manually(game['install_path'])
                
                if icon_bytes:
                    self._cache.save_icon_bytes(game_id, icon_bytes)
                    b64_str = self._cache.get_base64('icon', game_id)
                    
                    time.sleep(0.05)
                    self._window.evaluate_js(f"UI.updateListIcon('{game_id}', '{b64_str}')")
    
    def _load_icons_async(self):
        icon_cache = self._config.get("icon_cache", {})
        
        for game in self._cached_games:
            game_id = str(game['id'])
            icon_data = None

            if game_id in icon_cache:
                icon_data = icon_cache[game_id]
            else:
                icon_data = self._scanner.extract_icon_manually(game['install_path'])
                if icon_data:
                    icon_cache[game_id] = icon_data

            if icon_data:
                self._window.evaluate_js(f"UI.updateListIcon('{game_id}', '{icon_data}')")
        
        self._config.set("icon_cache", icon_cache)
                
    def get_game_details(self, game_id: str):
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
                path.unlink()
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

    def play_game(self, game_id: str):
        game = next((g for g in self._cached_games if str(g['id']) == str(game_id)), None)
        if game:
            return self._launcher.launch(game)
        return False
    
    def stop_game(self):
        if self._launcher:
            self._launcher.stop_current_game()

  
    