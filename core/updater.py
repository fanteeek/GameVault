import requests
import sys
import subprocess

from core.file_utils import FileUtils

class UpdaterService:
    GITHUB_API_URL = "https://api.github.com/repos/fanteeek/GameVault/releases/latest"

    @staticmethod
    def version_to_tuple(v):
        try:
            v = v.lower().lstrip('v')
            import re
            clean_v = re.split(r'[^0-9.]', v)[0]
            parts = clean_v.strip('.').split('.')
            return tuple(map(int, parts))
        except Exception:
            return (0, 0, 0)

    
    @staticmethod
    def check_for_updates(current_version):
        try:
            response = requests.get(UpdaterService.GITHUB_API_URL, timeout=5)
            if response.status_code == 200:
                data = response.json()
                latest_version = data['tag_name']
                
                v_latest = UpdaterService.version_to_tuple(latest_version)
                v_current = UpdaterService.version_to_tuple(current_version)
                
                if v_latest > v_current:
                    return {
                        "update_available": True,
                        "latest_version": latest_version,
                        "download_url": data['assets'][0]['browser_download_url'],
                        "changelog": data['body']
                    }
        except Exception as e:
            print(f"Ошибка проверки обновлений: {e}")
        return {"update_available": False}

    @staticmethod
    def install_update(download_url):
        try:
            app_dir = FileUtils.get_app_dir()
            setup_path = app_dir / "GameVault_Update_Setup.exe"
            
            response = requests.get(download_url, stream=True)
            with open(setup_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            
            print("Запуск обновления...")
            subprocess.Popen([
                str(setup_path), 
                '/VERYSILENT', 
                '/SUPPRESSMSGBOXES', 
                '/NORESTART', 
                '/CLOSEAPPLICATIONS'
            ], shell=True)

            sys.exit(0)
            
        except Exception as e:
            print(f"Ошибка обновления: {e}")
            return False