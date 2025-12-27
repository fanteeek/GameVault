import datetime
import re
import winreg
from pathlib import Path
from typing import Optional, List, Dict, Any
import requests
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
            return [Path(val["path"]) for val in data.get("libraryfolders", {}).values() if "path" in val]

    def get_active_user_context(self) -> Dict[str, str]:
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
    
    def get_game_news(self, steam_id: str) -> List[Dict[str, Any]]:
        if not steam_id or str(steam_id) == "None":
            return []

        try:
            url = f"http://api.steampowered.com/ISteamNews/GetNewsForApp/v0002/?appid={steam_id}&count=5&maxlength=300&format=json"
            
            response = requests.get(url, timeout=3)
            
            if response.status_code != 200:
                return []

            data = response.json()
            news_items = []
            
            for item in data.get('appnews', {}).get('newsitems', []):
                date_str = datetime.datetime.fromtimestamp(item['date']).strftime('%d.%m.%Y')
                raw_content = item.get('contents', '')
                
                image_url = None
                img_match = re.search(r'(https?://[^\s"]+\.(?:png|jpg|jpeg|gif))', raw_content)
                
                if img_match: image_url = img_match.group(1)
                elif 'src="' in raw_content:
                    src_match = re.search(r'src="([^"]+)"', raw_content)
                    if src_match:
                        image_url = src_match.group(1)
                
                clean_text = re.sub(r'<[^<]+?>', '', raw_content)
                if image_url: clean_text = clean_text.replace(image_url, '')
                clean_text = clean_text.strip()
                
                news_items.append({
                    "title": item['title'],
                    "url": item['url'],
                    "author": item.get('feedlabel', 'Steam'),
                    "date": date_str,
                    "contents": clean_text.strip() + "...",
                    "image": image_url
                })
                
            return news_items
            
        except Exception as e:
            print(f"[SteamService] Error fetching news for {steam_id}: {e}")
            return []
        
    def get_hero_url(self, steam_id: str) -> str:
        return f"https://cdn.cloudflare.steamstatic.com/steam/apps/{steam_id}/library_hero.jpg"

    def get_logo_url(self, steam_id: str) -> str:
        return f"https://cdn.cloudflare.steamstatic.com/steam/apps/{steam_id}/logo.png"