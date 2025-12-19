import winreg
from pathlib import Path
from typing import Optional, List, Dict
import vdf

class SteamService:
    def __init__(self):
        self.install_path = self._get_install_path()

    def _get_install_path(self) -> Optional[Path]:
        for key_path in [r"SOFTWARE\WOW6432Node\Valve\Steam", r"SOFTWARE\Valve\Steam"]:
            try:
                with winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, key_path) as key:
                    path, _ = winreg.QueryValueEx(key, "InstallPath")
                    return Path(path)
            except FileNotFoundError:
                continue
        return None

    def get_library_paths(self) -> List[Path]:
        if not self.install_path: return []
        
        vdf_path = self.install_path / "steamapps" / "libraryfolders.vdf"
        if not vdf_path.exists(): return []

        with open(vdf_path, "r", encoding="utf-8") as f:
            data = vdf.load(f)
            # В структуре libraryfolders пути лежат в вложенных объектах
            return [Path(val["path"]) for val in data.get("libraryfolders", {}).values() if "path" in val]

    def get_active_user_context(self) -> Dict[str, str]:
        """Возвращает UID и hex-имя текущего пользователя Steam."""
        context = {"uid": "", "uid_short": "", "account_name": ""}
        if not self.install_path: return context

        login_vdf = self.install_path / "config" / "loginusers.vdf"
        if not login_vdf.exists(): return context

        with open(login_vdf, "r", encoding="utf-8") as f:
            users = vdf.load(f).get("users", {})
            for uid, info in users.items():
                if info.get("MostRecent") == "1":
                    context["uid"] = uid
                    context["uid_short"] = str(int(uid) & 0xFFFFFFFF)
                    context["account_name"] = info.get("AccountName", "")
                    break
        return context