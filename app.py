import sys
import webview
import ctypes
import logging
from bridge import Bridge

from core.file_utils import FileUtils

process_guard = ctypes.windll.kernel32.CreateMutexW(None, False, "GameVaultMutexVariable")

def get_screen_center(window_width, window_height):
    try:
        ctypes.windll.shcore.SetProcessDpiAwareness(1)
    except Exception:
        ctypes.windll.user32.SetProcessDPIAware()

    screen_width = ctypes.windll.user32.GetSystemMetrics(0)
    screen_height = ctypes.windll.user32.GetSystemMetrics(1)

    x = (screen_width - window_width) // 2
    y = (screen_height - window_height) // 2
    
    return x, y

def main():
    # Logging
    log_path = FileUtils.get_app_dir() / "logs" / "debug.log"
    log_path.parent.mkdir(parents=True, exist_ok=True)

    logging.basicConfig(
        filename=str(log_path),
        filemode='w',
        level=logging.DEBUG,
        format='%(asctime)s - %(levelname)s - %(message)s',
        encoding='utf-8',
        force=True
    )

    logging.info("App is starting...")
    logging.info(f"Executable path: {sys.executable}")
    
    if getattr(sys, 'frozen', False):
        path = FileUtils.get_resource_path("dist/index.html")
        url = str(path)
    else:
        url = 'http://127.0.0.1:5173'
    
    FileUtils.cleanup_installer()
    api = Bridge()
    
    win_w = 1250
    win_h = 700
    center_x, center_y = get_screen_center(win_w, win_h)
    
    icon_path = FileUtils.get_resource_path('gamevault.ico')
    
    window = webview.create_window(
        title='GameVault',
        url=url,
        js_api=api,
        width=win_w,
        height=win_h,
        x=center_x,
        y=center_y,
        frameless=True,      
        easy_drag=False,
        background_color='#191724'
    )
    
    api.set_window(window)
    webview.start(debug=not getattr(sys, 'frozen', False))

if __name__ == '__main__':
    main()