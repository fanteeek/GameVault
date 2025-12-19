let selectedGameId = null;
let activeInstallPath = null;
let activeGameName = null;
let isResizing = false;

// Ждем загрузки pywebview API
window.addEventListener('pywebviewready', function() {
    console.log('API готово');
    loadGames();
    initResizing();
});

function initResizing() {
    const r = document.getElementById('resizer-r');
    const b = document.getElementById('resizer-b');
    const rb = document.getElementById('resizer-rb');

    const handleMouseDown = (e, direction) => {
        isResizing = true;
        const startX = e.clientX;
        const startY = e.clientY;
        const startW = window.innerWidth;
        const startH = window.innerHeight;

        const onMouseMove = (moveEvent) => {
            if (!isResizing) return;

            let newW = startW;
            let newH = startH;

            if (direction === 'r' || direction === 'rb') {
                newW = startW + (moveEvent.clientX - startX);
            }
            if (direction === 'b' || direction === 'rb') {
                newH = startH + (moveEvent.clientY - startY);
            }

            // Ограничения минимального размера
            if (newW < 800) newW = 800;
            if (newH < 600) newH = 600;

            pywebview.api.resize_window(newW, newH);
        };

        const onMouseUp = () => {
            isResizing = false;
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    };

    r.addEventListener('mousedown', (e) => handleMouseDown(e, 'r'));
    b.addEventListener('mousedown', (e) => handleMouseDown(e, 'b'));
    rb.addEventListener('mousedown', (e) => handleMouseDown(e, 'rb'));
}


function loadGames() {
    const listContainer = document.getElementById('game-list');
    listContainer.classList.add('loading');
    
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) refreshBtn.classList.add('spinning'); // Можно добавить анимацию вращения


    // Вызываем метод из bridge.py
    pywebview.api.get_games().then(games => {
        // Небольшая искусственная задержка для красоты (300мс)
        setTimeout(() => {
            listContainer.innerHTML = '';
            
            // Группировка (код из прошлого шага) ...
            const steamGames = games.filter(g => g.source === 'steam');
            const localGames = games.filter(g => g.source === 'local');

            const renderGroup = (title, groupGames) => {
                if (groupGames.length > 0) {
                    const header = document.createElement('div');
                    header.className = 'list-section-title';
                    header.innerText = title;
                    listContainer.appendChild(header);

                    groupGames.forEach(game => {
                        const btn = document.createElement('button');
                        btn.className = 'nav-btn';
                        btn.innerText = game.name;
                        btn.onclick = (e) => selectGame(game, e.target); 
                        listContainer.appendChild(btn);
                    });
                }
            };

            renderGroup('Steam', steamGames);
            renderGroup('Локальные', localGames);

            // Обновляем статистику на Дашборде
            const statGames = document.getElementById('stat-total-games');
            if (statGames) statGames.innerText = games.length;

            // 2. Убираем затухание
            listContainer.classList.remove('loading');
        }, 300);
    });
}

function showEditor() {
    setActiveNav('nav-editor');
    alert("Редактор базы данных в разработке...");
}

function showDashboard() {
    // 1. Переключаем видимость
    document.getElementById('dashboard-view').style.display = 'flex';
    document.getElementById('game-view').style.display = 'none';

    // 2. Управляем активным состоянием кнопок
    setActiveNav('nav-home');
    
    // 3. Сбрасываем ID выбранной игры, чтобы случайно не сделать бэкап "ничего"
    selectedGameId = null;
    activeInstallPath = null;
}

function setActiveNav(activeId) {
    // Убираем класс active у всех кнопок в сайдбаре
    const allBtns = document.querySelectorAll('.nav-btn');
    allBtns.forEach(btn => btn.classList.remove('active'));

    // Добавляем класс active нужной кнопке (если передали ID)
    if (activeId) {
        const activeBtn = document.getElementById(activeId);
        if (activeBtn) activeBtn.classList.add('active');
    }
}

function selectGame(game, element) {
    document.getElementById('dashboard-view').style.display = 'none';
    document.getElementById('game-view').style.display = 'block'

    // Подсвечиваем выбранную игру в списке
    setActiveNav(null); // Сначала снимаем подсветку с "Главной" и "Редактора"

    if (element) {
        element.classList.add('active');
    }

    console.log("Выбрана игра:", game);
    selectedGameId = game.id;
    activeGameName = game.name;
    activeInstallPath = game.install_path;

    const hero = document.getElementById('hero-section');
    const logo = document.getElementById('game-logo');
    const titleFallback = document.getElementById('game-title-fallback');
    const details = document.getElementById('active-game-details');
    const sourceBadge = document.getElementById('source-badge');

    hero.style.opacity = '0';
    logo.style.display = 'none';
    logo.scr = '';

    setTimeout(() => {
        if (game.steam_id) {
            hero.style.backgroundImage = `url('https://cdn.cloudflare.steamstatic.com/steam/apps/${game.steam_id}/library_hero.jpg')`;
            logo.src = `https://cdn.cloudflare.steamstatic.com/steam/apps/${game.steam_id}/logo.png`;
            const img = new Image();
            img.src = `https://cdn.cloudflare.steamstatic.com/steam/apps/${game.steam_id}/library_hero.jpg`;
            img.onload = () => { hero.style.opacity = '1'; };
        } else {
            hero.style.backgroundImage = 'none';
            hero.style.backgroundColor = 'var(--overlay)';
            hero.style.opacity = '1';
        }

        logo.onerror = () => {
            logo.style.display = 'none';
            titleFallback.innerText = game.name;
        };
        logo.onload = () => {
            logo.style.display = 'block';
            titleFallback.innerText = '';
        };

        sourceBadge.innerText = game.source === 'steam' ? 'Steam' : 'Local';
        details.innerText = `ID: ${game.id} | Path: ${game.install_path}`;
    }, 150);

    // Запрашиваем детали (размер и историю)
    pywebview.api.get_game_details(game.id).then(details => {
        if (details) {
            document.getElementById('save-size').innerText = details.size;
            renderHistory(details.backups);
        }
    });

}

function renderHistory(backups) {
    const list = document.getElementById('history-list');
    list.innerHTML = backups.length ? '' : '<p class="muted-text">Бэкапов еще нет</p>';
    
    backups.forEach(b => {
        const item = document.createElement('div');
        item.className = 'history-item';
        item.innerHTML = `
            <div class="history-info">
                <span class="history-name">${b.name}</span>
                <span class="history-meta">${b.size} | ${new Date(b.date * 1000).toLocaleDateString()}</span>
            </div>
            <button class="delete-btn" onclick="deleteBackup('${b.path.replace(/\\/g, '/')}')">🗑️</button>
        `;
        list.appendChild(item);
    });
}

function deleteBackup(filePath) {
    if (confirm("Удалить этот бэкап навсегда?")) {
        pywebview.api.delete_backup(filePath).then(success => {
            if (success) {
                // Просто обновляем детали игры, чтобы список перерисовался
                pywebview.api.get_game_details(selectedGameId).then(details => {
                    renderHistory(details.backups);
                });
            }
        });
    }
}

function openBackupFolder() {
    // Вызываем метод из bridge для открытия папки конкретной игры
    if (activeGameName) {
        pywebview.api.open_backup_folder(activeGameName);
    }
}

function requestBackup() {
     console.log("Попытка бэкапа для ID:", selectedGameId);

    if (!selectedGameId) {
        alert("Ошибка: Игра не выбрана");
        return;
    }

    // Показываем контейнер прогресса
    const progContainer = document.getElementById('progress-container');
    const backupBtn = document.getElementById('backup-btn');
    
    progContainer.style.display = 'block';
    backupBtn.disabled = true;
    backupBtn.innerText = 'В процессе...';

    // Вызываем Python
    pywebview.api.start_backup(selectedGameId);
}

// Эту функцию вызывает Python через evaluate_js
function updateUIProgress(percent) {
    const fill = document.getElementById('progress-bar-fill');
    fill.style.width = percent + '%';
}

// Эту функцию вызывает Python по завершении
function onBackupComplete(result) {
    const backupBtn = document.getElementById('backup-btn');
    alert("Бэкап завершен: " + result);
    
    backupBtn.disabled = false;
    backupBtn.innerText = 'BACKUP';
    document.getElementById('progress-bar-fill').style.width = '0%';
    document.getElementById('progress-container').style.display = 'none';
}

function openGameFolder() {
    if (activeInstallPath) {
        pywebview.api.open_folder(activeInstallPath);
    } else {
        alert("Путь к игре не определен");
    }
}

function addPath() {
    pywebview.api.select_folder().then(response => {
        if (response.status === "success") {
            // Перезагружаем список игр, так как добавилась новая папка
            loadGames();

            const modal = document.getElementById('settings-modal');
            if (modal && modal.style.display === 'flex') {
                openSettings();
            }
        }
    });
}

// Удаление пути из настроек
function removePath(path) {
    console.log(path);
    if (confirm("Перестать сканировать эту папку?")) {
        pywebview.api.remove_folder(path).then(success => {
            if (success) {
                // После удаления обновляем и окно настроек, и основной список игр
                openSettings(); 
                loadGames();
            }
        });
    }
}

function openWiki() {
    if (activeGameName) {
        // Просто открываем браузер по ссылке
        const url = `https://www.pcgamingwiki.com/wiki/${encodeURIComponent(activeGameName)}`;
        window.open(url, '_blank'); 
        // Или через Python: pywebview.api.open_url(url)
    }
}

// Settings Modal

// Открытие модального окна настроек
function openSettings() {
    const modal = document.getElementById('settings-modal');
    
    // Запрашиваем актуальные данные из Python
    pywebview.api.get_settings().then(settings => {
        renderSettings(settings);
        modal.style.display = 'flex'; // Показываем окно
    });
}

// Закрытие окна
function closeSettings() {
    document.getElementById('settings-modal').style.display = 'none';
}

// Отрисовка списка путей в настройках
function renderSettings(settings) {
    const pathList = document.getElementById('settings-path-list');
    pathList.innerHTML = ''; // Очищаем старый список

    if (settings.non_steam_paths.length === 0) {
        pathList.innerHTML = '<p class="muted-text" style="margin-bottom: 10px;">Папки не добавлены</p>';
    }

    settings.non_steam_paths.forEach(path => {
        const item = document.createElement('div');
        item.className = 'path-item';
        item.innerHTML = `
            <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 350px;" title="${path}">
                ${path}
            </span>
            <button class="delete-btn" onclick="removePath('${path.replace(/\\/g, '/')}')">
                <span class="material-symbols-rounded">delete</span>
            </button>
        `;
        pathList.appendChild(item);
    });
}

// Закрытие модалки при клике вне контента
window.onclick = function(event) {
    const modal = document.getElementById('settings-modal');
    if (event.target == modal) {
        closeSettings();
    }
}

