import json
from pathlib import Path
from typing import Any, Dict

from core.file_utils import FileUtils

class ConfigService:
    def __init__(self, filename: str = "settings.json"):
        self.path = FileUtils.get_app_dir() / filename
        self.data: Dict[str, Any] = self._load()
        if "backup_root" not in self.data:
            default_path = FileUtils.get_app_dir() / "backups"
            self.data["backup_root"] = str(default_path)
            self.save()

    def _load(self) -> Dict[str, Any]:
        if self.path.exists():
            with open(self.path, "r", encoding="utf-8") as f:
                return json.load(f)
        return {"non_steam_paths": []}

    def save(self):
        with open(self.path, "w", encoding="utf-8") as f:
            json.dump(self.data, f, indent=4)

    def get(self, key: str, default: Any = None) -> Any:
        return self.data.get(key, default)

    def set(self, key: str, value: Any):
        self.data[key] = value
        self.save()