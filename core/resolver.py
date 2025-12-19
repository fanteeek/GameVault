import os
import re
from pathlib import Path
from typing import List, Optional, Dict

from core.steam import SteamService

class PathResolver:
    def __init__(self, steam_service: SteamService):
        self.steam = steam_service
        self.user_context = self.steam.get_active_user_context()
        self.system_paths = self._get_system_paths()

    def _get_system_paths(self) -> Dict[str, str]:
        user_profile = Path.home()
        appdata = os.getenv("APPDATA")
        localappdata = os.getenv("LOCALAPPDATA")
        
        # Получаем hex_uid как в оригинальном коде
        account_name = self.user_context.get("account_name", "")
        hex_uid = account_name.encode('utf-8').hex() if account_name else ""

        return {
            "{{p|username}}": os.getlogin(),
            "{{p|userprofile}}": str(user_profile),
            "{{p|userprofile\\documents}}": str(user_profile / "Documents"),
            "{{p|userprofile\\appdata\\locallow}}": str(user_profile / "AppData" / "LocalLow"),
            "{{p|appdata}}": appdata,
            "{{p|localappdata}}": localappdata,
            "{{p|programfiles}}": os.getenv("PROGRAMFILES", "C:\\Program Files"),
            "{{p|programdata}}": os.getenv("PROGRAMDATA", "C:\\ProgramData"),
            "{{p|public}}": os.getenv("PUBLIC", "C:\\Users\\Public"),
            "{{p|windir}}": os.getenv("WINDIR", "C:\\Windows"),
            "{{p|steam}}": str(self.steam.install_path) if self.steam.install_path else "",
            "{{p|uid}}": self.user_context.get("uid_short", ""),
            "{{p|hexuid}}": hex_uid # Добавили hexuid из оригинала
        }

    def resolve(self, template: str, game_path: Optional[Path] = None) -> str:
        if not template: return ""
        
        path_str = template.lower()
        
        # Заменяем системные переменные
        for placeholder, value in self.system_paths.items():
            if value:
                path_str = path_str.replace(placeholder.lower(), value)

        # Обработка переменной {{p|game}}
        if game_path:
            path_str = path_str.replace("{{p|game}}", str(game_path))

        # Финальная очистка и проверка на существование
        try:
            # Пытаемся раскрыть переменные окружения типа %USERPROFILE% если они остались
            path_str = os.path.expandvars(path_str)
            resolved_path = Path(path_str).resolve()
            return str(resolved_path)
        except Exception:
            return path_str