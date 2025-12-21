import subprocess
import requests

from core.file_utils import FileUtils

class UpdaterService:
    GITHUB_API_URL = "https://api.github.com/repos/fanteeek/GameVault/releases"

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
                releases = response.json()
                if not releases:
                    return {"update_available": False}
                
                latest_release = releases[0]
                latest_version = latest_release['tag_name']
                
                
                v_latest = UpdaterService.version_to_tuple(latest_version)
                v_current = UpdaterService.version_to_tuple(current_version)
                
                if v_latest > v_current:
                    download_url = None
                    for asset in latest_release.get('assets', []):
                        if asset['name'].endswith('.exe'):
                            download_url = asset['browser_download_url']
                            break
                        
                    if download_url:
                        return {
                            "update_available": True,
                            "latest_version": latest_version,
                            "download_url": download_url,
                            "changelog": latest_release.get('body', '')
                        }
        except Exception as e:
            print(f"Ошибка проверки обновлений: {e}")
        return {"update_available": False}

    @staticmethod
    def install_update(download_url, progress_callback):
        try:
            app_dir = FileUtils.get_app_dir()
            setup_path = app_dir / "GameVault_Setup.exe"
            
            response = requests.get(download_url, stream=True)
            total_size = int(response.headers.get('content-length', 0))
            
            downloaded = 0
            with open(setup_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)
                        downloaded += len(chunk)
                        if total_size > 0:
                            percent = (downloaded / total_size) * 100
                            progress_callback(percent)
            
            args = "/VERYSILENT /SP- /SUPPRESSMSGBOXES /NORESTART /NOCANCEL /CLOSEAPPLICATIONS /RESTARTAPPLICATIONS"
            cmd = f'cmd /c start "" "{setup_path}" {args}'
            subprocess.Popen(cmd, shell=True)
            return True
        
        except Exception as e:
            print(f"Ошибка: {e}")
            return False