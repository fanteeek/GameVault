from typing import List, Dict, Optional
from pathlib import Path
import sqlite3
import json

from core.config import ConfigService
from core.resolver import PathResolver
from core.steam import SteamService
from core.file_utils import FileUtils

class GameScanner:
    def __init__(self, steam: SteamService, config: ConfigService, resolver: PathResolver):
        self.steam = steam
        self.config = config
        self.resolver = resolver
        self.db_path = FileUtils.get_app_dir() / "database.db"

    def _query_db(self, field: str, value: str) -> Optional[dict]:
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.row_factory = sqlite3.Row
                cur = conn.cursor()
                
                if field == "install_folder":
                    query = f"""
                    SELECT * FROM games
                    WHERE ';' || {field} || ';' LIKE '%;' || ? || ';%'
                    """
                    cur.execute(query, (value,))
                else:
                    cur.execute(f"SELECT * FROM games WHERE {field} = ?", (value,))
                
                
                row = cur.fetchone()
                return dict(row) if row else None
        except Exception as e:
            print(f"[DataBase] Error: {e}")
            return None

    def scan_all(self) -> List[Dict]:
        games = []
        
        all_db_games = []
        
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.row_factory = sqlite3.Row
                all_db_games = [dict(r) for r in conn.execute("SELECT * FROM GAMES")]
        except Exception as e:
            print(f"[DataBase] Load Error: {e}")
            
        def find_game_in_db(folder_name):
            for g in all_db_games:
                aliases = [a.strip() for a in (g['install_folder'] or "").split(';') if a.strip()]
                if folder_name in aliases:
                    return g
            return None

        # steam
        for lib in self.steam.get_library_paths():
            common_dir = lib / "steamapps" / "common"
            if not common_dir.exists(): continue
            
            for folder in common_dir.iterdir():
                if folder.is_dir():
                    game_data = find_game_in_db(folder.name)
                    if game_data:
                        if self._is_really_installed(folder, game_data["steam_id"]):
                            games.append(self._format_game(game_data, folder, 'steam'))

        # local games
        for path_str in self.config.get("non_steam_paths", []):
            local_path = Path(path_str)
            if not local_path.exists(): continue
            
            for folder in local_path.iterdir():
                if folder.is_dir():
                    game_data = find_game_in_db(folder.name)
                    if game_data:
                        if self._is_really_installed(folder):
                            games.append(self._format_game(game_data, folder, 'local'))
        
        return games
        
    def _format_game(self, db_data: dict, folder: Path, source: str) -> dict:
        save_data = json.loads(db_data["save_location"])
        win_templates = save_data.get("win", [])
        resolved_saves = [self.resolver.resolve(t, folder) for t in win_templates]

        return {
            "id": db_data["steam_id"] or db_data["install_folder"],
            "name": db_data["title"],
            "steam_id": db_data["steam_id"],
            "install_path": str(folder),
            "save_paths": resolved_saves,
            "source": source,
            "local_icon": None 
        } 
    
    def extract_icon_manually(self, game_install_path: str) -> bytes | None:
        folder = Path(game_install_path)
        if not folder.exists(): return None

        all_exes = []
        try:
            all_exes.extend([x for x in folder.iterdir() if x.is_file() and x.name.lower().endswith('.exe')])
            for p in folder.rglob("*.exe"):
                depth = len(p.parts) - len(folder.parts)
                if 1 <= depth <= 5:
                    if p not in all_exes: all_exes.append(p)
        except: pass

        if not all_exes: return None

        candidates = []
        for exe in all_exes:
            score = self._score_exe_candidate(exe, folder)
            if score > 0:
                candidates.append((exe, score))

        candidates.sort(key=lambda x: x[1], reverse=True)

        for exe_path, score in candidates:
            icon_data = FileUtils.extract_icon_to_bytes(str(exe_path))
            if icon_data:
                return icon_data

        return None

    def _score_exe_candidate(self, exe: Path, game_root: Path) -> int:
        score = 0
        name = exe.name.lower()
        
        BLACKLIST = [
            "unins", "setup", "helper", "crash", "report", "config", "tool", "7za",
            "dxwebsetup", "vcredist", "launcher", "steam_cleaner", "easyanticheat",
            "touchup", "cleanup", "activation", "redist", "overlay", "physx", "start_protected_game"
        ]
        if any(bad in name for bad in BLACKLIST):
            return -100

        try:
            size_mb = exe.stat().st_size / (1024 * 1024)
        except: return -100

        if 15 < size_mb < 500: score += 50
        elif 2 < size_mb <= 15: score += 20
        elif 0.2 < size_mb <=5: score += 3
        
        clean_folder_name = "".join(filter(str.isalnum, game_root.name.lower()))
        clean_exe_name = "".join(filter(str.isalnum, exe.stem.lower()))
        
        if clean_exe_name == clean_folder_name:
            score += 100
        elif clean_exe_name in clean_folder_name or clean_folder_name in clean_exe_name:
            score += 40

        path_str = str(exe).lower()
        if "bin" in path_str or "win64" in path_str or "shipping" in path_str:
            score += 30

        return score
    
    def _is_really_installed(self, folder: Path, steam_id: str = None) -> bool:
        if steam_id:
            manifest_path = folder.parent.parent / f"appmanifest_{steam_id}.acf"
            if manifest_path.exists():
                return True
            return False

        try:
            exes = list(folder.glob("*.exe")) + list(folder.glob("*/*.exe"))
            if exes:
                return True
        except Exception:
            return False

        return False