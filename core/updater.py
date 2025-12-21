import requests
import os
import sys
import subprocess

from core.file_utils import FileUtils

class UpdaterService:
    GITHUB_API_URL = "https://api.github.com/repos/fanteek/GameVault/releases/latest"

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
            current_exe = sys.executable
            new_exe = app_dir / "GameVault_new.exe"
            
            response = requests.get(download_url, stream=True)
            with open(new_exe, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)

            bat_path = app_dir / "update_helper.bat"
            bat_content = f"""
            @echo off
            timeout /t 2 /nobreak > nul
            del "{current_exe}"
            ren "{new_exe.name}" "{os.path.basename(current_exe)}"
            start "" "{os.path.basename(current_exe)}"
            del "%~f0"
            """
            
            with open(bat_path, "w", encoding="cp1251") as f:
                f.write(bat_content)

            subprocess.Popen([str(bat_path)], shell=True)
            sys.exit(0)
            
        except Exception as e:
            print(f"Ошибка при установке: {e}")
            return False