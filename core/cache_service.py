import base64
import os
import requests
from pathlib import Path
from core.file_utils import FileUtils

class CacheService:
    def __init__(self):
        self.icons_dir = FileUtils.get_cache_dir("icons")
        self.hero_dir = FileUtils.get_cache_dir("hero")
        self.logo_dir = FileUtils.get_cache_dir("logo")
        
    def _get_path(self, category: str, game_id: str ) -> Path:
        if category == 'icon':
            return self.icons_dir / f"{game_id}.png"
        elif category == 'hero':
            return self.hero_dir / f"{game_id}.jpg"
        elif category == 'logo':
            return self.logo_dir / f"{game_id}.png"
        return None
    
    def save_icon_bytes(self, game_id: str, png_bytes: bytes):
        path = self._get_path('icon', game_id)
        with open(path, "wb") as f:
            f.write(png_bytes)
    
    def save_from_url(self, category: str, game_id: str, url: str):
        try:
            path = self._get_path(category, game_id)
            if path.exists(): return True
            
            print(f"[{category}] Downloading for {game_id}: {url}")
            
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
            
            response = requests.get(url, stream=True, timeout=10, headers=headers)
            if response.status_code != 200:
                print(f"[{category}] 404 Not Found for {game_id}. Skipping.")
                return False
            
            if response.status_code == 200:
                with open(path, 'wb') as f:
                    for chunk in response.iter_content(1024):
                        f.write(chunk)
                print(f"[{category}] Saved to {path}")
                return True
        except Exception as e:
            print(f"Error caching {category} for {game_id}: {e}")
            if path.exists() and path.stat().st_size == 0:
                os.remove(path)
        return False
    
    def get_base64(self, category: str, game_id: str) -> str | None:
        path = self._get_path(category, game_id)
        
        if not path.exists():
            return None
        
        try:
            with open(path, "rb") as f:
                data = f.read()
                b64 = base64.b64encode(data).decode('utf-8')
                
                mime = "image/png"
                if path.suffix == '.jpg': mime = "image.jpeg"
                
                return f"data:{mime};base64,{b64}"
        except Exception:
            return None
    
    def has_cached(self, category: str, game_id: str) -> bool:
        return self._get_path(category, game_id).exists()