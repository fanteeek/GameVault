let selectedGameId = null;
let activeInstallPath = null;
let activeGameName = null;

// Ждем загрузки pywebview API
window.addEventListener('pywebviewready', function() {
    console.log('API готово');
    loadGames();
});

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
            <span>${b.name}</span>
            <span class="muted-text">${b.size}</span>
        `;
        list.appendChild(item);
    });
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

function addFolder() {
    pywebview.api.select_folder().then(response => {
        if (response.status === "success") {
            // Перезагружаем список игр, так как добавилась новая папка
            loadGames();
        }
    });
}