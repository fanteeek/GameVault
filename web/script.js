let selectedGameId = null;
let activeInstallPath = null;

// Ждем загрузки pywebview API
window.addEventListener('pywebviewready', function() {
    console.log('API готово');
    loadGames();
});

function loadGames() {
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) refreshBtn.classList.add('spinning'); // Можно добавить анимацию вращения


    // Вызываем метод из bridge.py
    pywebview.api.get_games().then(games => {
        const listContainer = document.getElementById('game-list');
        listContainer.innerHTML = '';
        
        // Разделяем игры на группы
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
                    btn.onclick = () => selectGame(game);
                    listContainer.appendChild(btn);
                });
            }
        };

        renderGroup('Steam', steamGames);
        renderGroup('Локальные', localGames);

        if (refreshBtn) refreshBtn.classList.remove('spinning');
    });
}

function selectGame(game) {
    const hero = document.getElementById('hero-section');
    const logo = document.getElementById('game-logo');
    const titleFallback = document.getElementById('game-title-fallback');
    const details = document.getElementById('active-game-details');
    
    console.log("Выбрана игра:", game);
    selectedGameId = game.id;
    activeInstallPath = game.install_path;

    const sourceBadge = document.getElementById('source-badge');
    sourceBadge.innerText = game.source === 'steam' ? 'Steam' : 'Local';

    hero.style.opacity = '0';
    logo.style.display = 'none';
    logo.scr = '';
    titleFallback.innerText = '';

    setTimeout(() => {
        hero.style.backgroundImage = `url('https://cdn.cloudflare.steamstatic.com/steam/apps/${game.steam_id}/library_hero.jpg')`;
        
        const img = new Image();
        img.src = `https://cdn.cloudflare.steamstatic.com/steam/apps/${game.steam_id}/library_hero.jpg`;
        img.onload = () => { hero.style.opacity = '1'; };
        
        // 3. Работа с логотипом
        if (game.steam_id) {
            logo.src = `https://cdn.cloudflare.steamstatic.com/steam/apps/${game.steam_id}/logo.png`;
            logo.onerror = () => {
                logo.style.display = 'none';
                titleFallback.innerText = game.name;
            };
            logo.onload = () => {
                logo.style.display = 'block';
            };
        } else {
            titleFallback.innerText = game.name;
        }

        details.innerText = `Steam ID: ${game.steam_id || 'Non-Steam'}`;
    
    }, 150);

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