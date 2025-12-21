import subprocess
import psutil
import threading
import time
import os
from pathlib import Path

class LauncherService:
    def __init__(self, window):
        self.window = window
        self.current_process = None
        self.is_running = False

    def launch(self, game_data):
        if self.is_running:
            return

        try:
            if game_data['source'] == 'steam':
                os.startfile(f"steam://run/{game_data['steam_id']}")
                threading.Thread(target=self._monitor_steam_game, args=(game_data,), daemon=True).start()
            else:
                exe_path = self._find_main_exe(game_data['install_path'])
                if exe_path:
                    proc = subprocess.Popen(str(exe_path), cwd=str(exe_path.parent))
                    self.current_process = psutil.Process(proc.pid)
                    threading.Thread(target=self._monitor_process, daemon=True).start()
            
            self._set_running_status(True)
            return True
        except Exception as e:
            print(f"Launch error: {e}")
            return False

    def stop_current_game(self):
        if self.current_process and self.current_process.is_running():
            try:
                parent = self.current_process
                for child in parent.children(recursive=True):
                    child.kill()
                parent.kill()
            except:
                pass
        self._set_running_status(False)

    def _find_main_exe(self, path):
        exes = list(Path(path).rglob("*.exe"))
        if not exes: return None
        return max(exes, key=lambda p: p.stat().st_size)

    def _set_running_status(self, status):
        self.is_running = status
        self.window.evaluate_js(f"UI.togglePlayButton({ 'true' if status else 'false' })")

    def _monitor_process(self):
        while self.current_process and self.current_process.is_running():
            time.sleep(2)
        self._set_running_status(False)

    def _monitor_steam_game(self, game_data):
        game_name_part = Path(game_data['install_path']).name.lower()
        start_time = time.time()
        
        found_proc = None
        while time.time() - start_time < 30:
            for proc in psutil.process_iter(['name']):
                if game_name_part in proc.info['name'].lower():
                    found_proc = proc
                    break
            if found_proc: break
            time.sleep(2)

        if found_proc:
            self.current_process = found_proc
            while self.current_process.is_running():
                time.sleep(2)
        
        self._set_running_status(False)