import cloudscraper
import mwparserfromhell
import json

class WikiService:
    def __init__(self):
        self.scraper = cloudscraper.create_scraper()
        self.api_url = "https://www.pcgamingwiki.com/w/api.php"

    def find_save_paths(self, game_name: str) -> list[str]:
        params = {
            "action": "parse",
            "page": game_name,
            "prop": "wikitext",
            "format": "json",
            "redirects": "1"
        }
        try:
            response = self.scraper.get(self.api_url, params=params)
            data = response.json()
            wikitext = data.get("parse", {}).get("wikitext", {}).get("*", "")
            if not wikitext: return []

            parsed = mwparserfromhell.parse(wikitext)
            paths = []
            for template in parsed.filter_templates():
                if template.name.matches("Game data/saves") and template.has(1):
                    platform = str(template.get(1).value).strip()
                    if platform in ["Windows", "Steam"]:
                        paths.append(str(template.get(2).value).strip())
            return paths
        except Exception as e:
            print(f"Wiki error: {e}")
            return []