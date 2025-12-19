let selectedGameId = null;
let activeInstallPath = null;
let activeGameName = null;
let isResizing = false;
let currentBackups = [];
const HERO_PLACEHOLDER = 'assets/hero_placeholder.jpg';

// Ждем загрузки pywebview API
window.addEventListener('pywebviewready', function() {
    console.log('API готово');
    loadGames();
    initResizing();
    initTitlebar();
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
    showDashboard();
    const listContainer = document.getElementById('game-list');
    listContainer.classList.add('loading');
    
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) refreshBtn.classList.add('spinning'); // Можно добавить анимацию вращения


    pywebview.api.get_games().then(games => {
        setTimeout(() => {
            listContainer.innerHTML = '';
            
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

            listContainer.classList.remove('loading');
        }, 300);
    });
}

function showEditor() {
    setActiveNav('nav-editor');
    alert("Редактор базы данных в разработке...");
}

async function showDashboard() {
    document.getElementById('dashboard-view').style.display = 'flex';
    document.getElementById('game-view').style.display = 'none';
    setActiveNav('nav-home');

    // Запрашиваем глобальную статистику из Python
    const stats = await pywebview.api.get_dashboard_stats();
    
    document.getElementById('stat-total-games').innerText = stats.total_games;
    document.getElementById('stat-total-size').innerText = stats.total_backups_size;
}

function setActiveNav(activeId) {
    const allBtns = document.querySelectorAll('.nav-btn');
    allBtns.forEach(btn => btn.classList.remove('active'));

    if (activeId) {
        const activeBtn = document.getElementById(activeId);
        if (activeBtn) activeBtn.classList.add('active');
    }
}

function preloadImage(url) {
    return new Promise((resolve) => {
        if (!url) return resolve(); 
        const img = new Image();
        img.src = url;
        img.onload = resolve;
        img.onerror = resolve; 
    });
}

async function selectGame(game, element) {
    document.getElementById('dashboard-view').style.display = 'none';
    document.getElementById('game-view').style.display = 'none';
    document.getElementById('game-loader').style.display = 'flex';

    setActiveNav(null); 
    if (element) element.classList.add('active');

    selectedGameId = game.id;
    activeGameName = game.name;
    activeInstallPath = game.install_path;

    const steamHeroUrl = game.steam_id 
        ? `https://cdn.cloudflare.steamstatic.com/steam/apps/${game.steam_id}/library_hero.jpg` 
        : null;

    const tasks = [
        pywebview.api.get_game_details(game.id),
        validateHeroImage(steamHeroUrl)
    ];

     if (game.steam_id) {
        const logoUrl = `https://cdn.cloudflare.steamstatic.com/steam/apps/${game.steam_id}/logo.png`;
        tasks.push(preloadImage(logoUrl));
    }

    const [details, validatedHeroUrl] = await Promise.all(tasks);

    updateGameUI(game, details, validatedHeroUrl);

    document.getElementById('game-loader').style.display = 'none';
    const gameView = document.getElementById('game-view');
    gameView.style.display = 'block';
    gameView.style.animation = 'fadeIn 0.5s ease';
}

// Вспомогательная функция специально для валидации фона
function validateHeroImage(url) {
    return new Promise((resolve) => {
        if (!url) return resolve(HERO_PLACEHOLDER); 

        const img = new Image();
        img.src = url;
        
        img.onload = () => resolve(url);
        img.onerror = () => resolve(HERO_PLACEHOLDER); 
    });
}

function updateGameUI(game, details, heroUrl) {
    const hero = document.getElementById('hero-section');
    const logo = document.getElementById('game-logo');
    const titleFallback = document.getElementById('game-title-fallback');
    const detailsText = document.getElementById('active-game-details');
    const sourceBadge = document.getElementById('source-badge');

    hero.style.backgroundImage = `
        linear-gradient(to top, var(--base) 5%, transparent 90%),
        linear-gradient(to right, var(--base) 0%, transparent 70%),
        url('${heroUrl}')
    `;
    hero.style.opacity = '1';

    if (game.steam_id) {
        logo.src = `https://cdn.cloudflare.steamstatic.com/steam/apps/${game.steam_id}/logo.png`;
        logo.style.display = 'block';
        titleFallback.innerText = '';
        logo.onerror = () => {
            logo.style.display = 'none';
            titleFallback.innerText = game.name;
        };
    } else {
        logo.style.display = 'none';
        titleFallback.innerText = game.name;
    }

    sourceBadge.innerText = game.source === 'steam' ? 'Steam' : 'Local';
    detailsText.innerText = `ID: ${game.id}`;

    if (details) {
        document.getElementById('save-size').innerText = details.size;
        currentBackups = details.backups;
        renderHistory(details.backups);
    }
}

function renderHistory(backups) {
    const list = document.getElementById('history-list');
    list.innerHTML = '';

    if (!backups || backups.length === 0) {
        list.innerHTML = '<p class="muted-text">Бэкапов еще не создано.</p>';
        return;
    }

    backups.forEach(b => {
        const item = document.createElement('div');
        item.className = 'history-item';
        item.innerHTML = `
            <div class="history-info">
                <span class="history-name">${b.name}</span>
                <span class="history-meta">${b.size} • ${new Date(b.date * 1000).toLocaleDateString()}</span>
            </div>
            <button class="simple-icon-btn" onclick="deleteBackup('${b.path.replace(/\\/g, '/')}')">
                <span class="material-symbols-rounded">delete</span>
            </button>
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
    if (activeGameName) {
        pywebview.api.open_backup_folder(activeGameName);
    }
}

function requestBackup() {
    if (!selectedGameId) return;
    console.log("Попытка бэкапа для ID:", selectedGameId);

    const progContainer = document.getElementById('progress-container');
    const fill = document.getElementById('progress-bar-fill');
    const backupBtn = document.getElementById('backup-btn');

    

    // Подготовка UI
    if (progContainer) {
        progContainer.classList.remove('closing'); // Сбрасываем класс закрытия, если он был
        progContainer.style.display = 'block';
    }
    if (fill) fill.style.width = '0%';
    
    if (backupBtn) {
        backupBtn.disabled = true;
        backupBtn.innerHTML = `<span class="material-symbols-rounded">sync</span> Сжатие...`;
    }

    pywebview.api.start_backup(selectedGameId);
}

// Эту функцию вызывает Python через evaluate_js
function updateUIProgress(percent) {
    const fill = document.getElementById('progress-bar-fill');
    const percentText = document.getElementById('progress-percent'); // Добавь такой ID в HTML если нужно

    if (fill) fill.style.width = percent + '%';
    if (percentText) percentText.innerText = Math.round(percent) + '%';
}

// Эту функцию вызывает Python по завершении
function onBackupComplete(result) {
    const backupBtn = document.getElementById('backup-btn');
    const progContainer = document.getElementById('progress-container');
    const fill = document.getElementById('progress-bar-fill');

    // 1. Доводим полоску до конца, если она не успела
    if (fill) fill.style.width = '100%';

    // 2. Небольшая пауза, чтобы пользователь увидел завершение (800мс - 1с)
    setTimeout(() => {
        // 3. Запускаем анимацию исчезновения
        if (progContainer) {
            progContainer.classList.add('closing');
            
            // 4. Когда анимация исчезновения закончится — полностью скрываем
            progContainer.onanimationend = () => {
                if (progContainer.classList.contains('closing')) {
                    progContainer.style.display = 'none';
                    progContainer.classList.remove('closing');
                    
                    // Возвращаем кнопку в обычное состояние
                    if (backupBtn) {
                        backupBtn.disabled = false;
                        backupBtn.innerHTML = `<span class="material-symbols-rounded">inventory_2</span> BACKUP`;
                    }
                    
                    // Обновляем список бэкапов в модалке (так как появился новый)
                    pywebview.api.get_game_details(selectedGameId).then(details => {
                        if (details) currentBackups = details.backups;
                    });
                    
                    // Опционально: выводим уведомление об успехе
                    console.log("Бэкап готов:", result);
                }
            };
        }
    }, 1000); 
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
    const modal = document.getElementById('settings-modal');
    modal.classList.add('closing');
    modal.onanimationend = () => {
        if (modal.classList.contains('closing')) {
            modal.style.display = 'none';
            modal.classList.remove('closing');
        }
    };
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
            <button class="simple-icon-btn" onclick="removePath('${path.replace(/\\/g, '/')}')">
                <span class="material-symbols-rounded">delete</span>
            </button>
        `;
        pathList.appendChild(item);
    });
}

// Функция открытия модалки истории
function openHistoryModal() {
    const modal = document.getElementById('history-modal');
    renderHistory(currentBackups); // Отрисовываем то, что уже загружено
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('show'), 10);
}

function closeHistoryModal() {
    const modal = document.getElementById('history-modal');
    modal.classList.add('closing');
    modal.onanimationend = () => {
        if (modal.classList.contains('closing')) {
            modal.style.display = 'none';
            modal.classList.remove('closing');
        }
    };

    modal.classList.remove('show');
    setTimeout(() => modal.style.display = 'none', 400);
}

function requestPlay() {
    if (selectedGameId) {
        pywebview.api.play_game(selectedGameId).then(success => {
            if (!success) alert("Не удалось запустить игру. Проверьте путь к исполняемому файлу.");
        });
    }
}

// Функция переключения иконки и вызова максимизации
function handleMaximize() {
    pywebview.api.toggle_maximize().then(isMaximized => {
        const icon = document.getElementById('max-icon');
        // Меняем иконку: квадрат для обычного окна, "двойной квадрат" для развернутого
        icon.innerText = isMaximized ? 'filter_none' : 'crop_square';
    });
}

function initTitlebar() {
    const dragRegion = document.getElementById('titlebar');
    if (!dragRegion) return;

    // Двойной клик для развертывания
    dragRegion.addEventListener('dblclick', handleMaximize);

    // Восстановление при перетаскивании
    dragRegion.addEventListener('mousedown', (e) => {
        pywebview.api.get_maximize_status().then(isMaximized => {
            if (isMaximized) {
                const onMouseMove = (moveEvent) => {
                    if (Math.abs(moveEvent.screenX - e.screenX) > 5 || 
                        Math.abs(moveEvent.screenY - e.screenY) > 5) {
                        
                        pywebview.api.simple_restore().then(wasRestored => {
                            if (wasRestored) {
                                const icon = document.getElementById('max-icon');
                                if (icon) icon.innerText = 'crop_square';
                            }
                        });

                        // Удаляем слушатель сразу
                        document.removeEventListener('mousemove', onMouseMove);
                    }
                };

                const onMouseUp = () => {
                    document.removeEventListener('mousemove', onMouseMove);
                };

                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
            }
        });
    });
}

// Закрытие модалки при клике вне контента
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        // Мы ищем, какая именно функция должна сработать. 
        // Если ID совпадает с settings-modal — закрываем настройки, и т.д.
        if (event.target.id === 'settings-modal') closeSettings();
        if (event.target.id === 'history-modal') closeHistoryModal();
    }
}

window.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        // Проверяем, какое окно открыто (через display === 'flex') и закрываем его
        const settingsModal = document.getElementById('settings-modal');
        const historyModal = document.getElementById('history-modal');

        if (settingsModal.style.display === 'flex') closeSettings();
        if (historyModal.style.display === 'flex') closeHistoryModal();
    }
});

