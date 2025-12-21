import webview
import ctypes
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
    FileUtils.cleanup_installer()
    
    api = Bridge()
    
    win_w = 1250
    win_h = 700
    center_x, center_y = get_screen_center(win_w, win_h)
    
    html_path = str(FileUtils.get_resource_path("web/index.html"))
    
    window = webview.create_window(
        title='GameVault',
        url=html_path,
        js_api=api,
        width=win_w,
        height=win_h,
        x=center_x,
        y=center_y,
        frameless=True,      
        easy_drag=False      
    )
    
    api.set_window(window)
    webview.start(debug=True)

if __name__ == '__main__':
    main()