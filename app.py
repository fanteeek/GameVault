import webview
import os
from bridge import Bridge

from core.file_utils import FileUtils

def main():
    api = Bridge()
    
    html_path = str(FileUtils.get_resource_path("web/index.html"))
    
    # Создаем окно
    window = webview.create_window(
        title='SManager',
        url=html_path,
        js_api=api,
        width=1250,
        height=700,
        frameless=True,      # Убираем рамки Windows
        easy_drag=False      # Отключаем стандартное перетаскивание (сделаем свое)
    )
    
    # Передаем ссылку на окно в API, чтобы управлять им из JS
    api.set_window(window)
    
    # Запуск
    webview.start(debug=True)

if __name__ == '__main__':
    main()