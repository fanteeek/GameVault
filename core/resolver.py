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
        return {
            "{{p|userprofile}}": str(user_profile),
            "{{p|userprofile\\documents}}": str(user_profile / "Documents"),
            "{{p|userprofile\\appdata\\locallow}}": str(user_profile / "AppData" / "LocalLow"),
            "{{p|appdata}}": os.getenv("APPDATA"),
            "{{p|localappdata}}": os.getenv("LOCALAPPDATA"),
            "{{p|public}}": os.getenv("PUBLIC", "C:\\Users\\Public"),
            "{{p|steam}}": str(self.steam.install_path) if self.steam.install_path else "",
            "{{p|uid}}": self.user_context["uid_short"]
        }

    def resolve(self, template: str, game_path: Optional[Path] = None) -> List[str]:
        """Превращает строку-шаблон в реальный путь на диске."""
        path_str = template.lower()
        
        # Заменяем системные переменные
        for placeholder, value in self.system_paths.items():
            path_str = path_str.replace(placeholder.lower(), value)

        # Обработка переменной {{p|game}}
        if game_path:
            path_str = path_str.replace("{{p|game}}", str(game_path))

        # Возвращаем как строку (для совместимости с UI)
        return str(Path(path_str).resolve()) if Path(path_str).exists() else path_str