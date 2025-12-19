from typing import List, Dict, Optional
from pathlib import Path
import sqlite3
import json

from core.config import ConfigService
from core.resolver import PathResolver
from core.steam import SteamService

class GameScanner:
    def __init__(self, steam: SteamService, config: ConfigService, resolver: PathResolver):
        self.steam = steam
        self.config = config
        self.resolver = resolver
        self.db_path = "database.db"

    def _query_db(self, field: str, value: str) -> Optional[dict]:
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.row_factory = sqlite3.Row
                cur = conn.cursor()
                cur.execute(f"SELECT * FROM games WHERE {field} = ?", (value,))
                row = cur.fetchone()
                return dict(row) if row else None
        except Exception as e:
            print(f"DB Error: {e}")
            return None

    def scan_all(self) -> List[Dict]:
        games = []
        
        # 1. Сканируем Steam
        for lib in self.steam.get_library_paths():
            common_dir = lib / "steamapps" / "common"
            if not common_dir.exists(): continue
            
            for folder in common_dir.iterdir():
                if folder.is_dir():
                    game_data = self._query_db("install_folder", folder.name)
                    if game_data:
                        games.append(self._format_game(game_data, folder, 'steam'))

        # 2. Сканируем локальные папки из настроек
        for path_str in self.config.get("non_steam_paths", []):
            local_path = Path(path_str)
            if not local_path.exists(): continue
            
            for folder in local_path.iterdir():
                if folder.is_dir():
                    game_data = self._query_db("install_folder", folder.name)
                    if game_data:
                        games.append(self._format_game(game_data, folder, 'local'))
        
        return games

    def _format_game(self, db_data: dict, folder: Path, source: str) -> dict:
        # Извлекаем пути сохранений из JSON в БД
        save_data = json.loads(db_data["save_location"])
        win_templates = save_data.get("win", [])
        resolved_saves = [self.resolver.resolve(t, folder) for t in win_templates]

        return {
            "id": db_data["steam_id"] or db_data["install_folder"],
            "name": db_data["title"],
            "steam_id": db_data["steam_id"],
            "install_path": str(folder),
            "save_paths": resolved_saves,
            "source": source
        }