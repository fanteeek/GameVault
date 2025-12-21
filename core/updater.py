import requests
import os
import sys
import subprocess

from core.file_utils import FileUtils

class UpdaterService:
    GITHUB_API_URL = "https://api.github.com/repos/fanteeek/GameVault/releases/latest"

    @staticmethod
    def check_for_updates(current_version):
        try:
            response = requests.get(UpdaterService.GITHUB_API_URL, timeout=5)
            if response.status_code == 200:
                data = response.json()
                latest_version = data['tag_name'].replace('v', '')
                
                if latest_version > current_version:
                    return {
                        "update_available": True,
                        "latest_version": latest_version,
                        "download_url": data['assets'][0]['browser_download_url'], # Ссылка на .exe
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
            
            # 1. Скачивание
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