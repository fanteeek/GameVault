// @ts-check
/** @global @type {any} */
var pywebview;

const State = {
    selectedGameId: null,
    activeInstallPath: null,
    activeGameName: null,
    isResizing: false,
    currentBackups: [],
    currentView: 'dashboard',
    HERO_PLACEHOLDER: 'assets/hero_placeholder.jpg'
};

const Elements = {
    get dashboard() { return document.getElementById('dashboard-view'); },
    get heroBg() { return document.getElementById('hero-bg') },
    get heroSection() { return document.getElementById('hero-section') },
    get gameView() { return document.getElementById('game-view'); },
    get gameLogo() { return document.getElementById('game-logo'); },
    get gameTitle() { return document.getElementById('game-title-fallback'); },
    get gameSourceBadge() { return document.getElementById('source-badge'); },
    get gameBackupSaveSize() { return document.getElementById('save-size'); },
    get detailsText() { return document.getElementById('active-game-details'); },
    get loader() { return document.getElementById('game-loader'); },
    get backupBtn() { return document.getElementById('backup-btn'); },
    get listContainer() { return document.getElementById('game-list'); },
    get settingsModal() { return document.getElementById('settings-modal'); },
    get historyModal() { return document.getElementById('history-modal'); },
    get historyList() { return document.getElementById('history-list');},
    get progressContainer() { return document.getElementById('progress-container'); },
    get progressBar() { return document.getElementById('progress-bar-fill'); },
    get maxIcon() { return document.getElementById('max-icon'); },
    get version() { return document.getElementById('app-version'); },
    get sidebar() { return /** @type {HTMLElement} */ (document.querySelector('.sidebar')); },
    get sidebarResizer() { return document.getElementById('sidebar-resizer'); },
};

const App = {
    async init() {
        console.log('API готово');

        const version = await pywebview.api.get_app_version();
        const versionEl = Elements.version;
        if (versionEl) versionEl.innerText = version;
        App.checkForUpdates();
        
        App.loadLibrary();
        WindowControl.initSidebarResizer();
        WindowControl.initResizing();
        WindowControl.initTitlebar();
        App.bindGlobalEvents();
    },

    async checkForUpdates() {
        const statusText = document.getElementById('status-text');
        if (statusText) statusText.innerText = "Проверка обновлений...";

        const update = await pywebview.api.check_updates();
        
        if (update && update.update_available) {
            if (statusText) {
                statusText.innerHTML = `Доступна ${update.latest_version}! <a href="#" onclick="App.runUpdate('${update.download_url}')" style="color: var(--iris); margin-left: 5px; text-decoration: none; font-weight: bold;">Обновить</a>`;
            }
            const dot = document.querySelector('.status-dot');
            // @ts-ignore
            if (dot) dot.style.background = 'var(--iris)';
        } else {
            if (statusText) statusText.innerText = "GameVault актуален";
        }
    },

    async runUpdate(url) {
        const statusText = document.getElementById('status-text');
        const progContainer = document.getElementById('update-progress-container');
        
        if (statusText) statusText.innerText = "Загрузка...";
        if (progContainer) progContainer.style.display = "block";

        pywebview.api.start_update(url);
    },

    updateDownloadProgress(percent) {
        const fill = document.getElementById('update-progress-fill');
        const statusText = document.getElementById('status-text');
        
        if (fill) fill.style.width = percent + '%';
        if (percent >= 100 && statusText) {
            statusText.innerText = "Запуск установки...";
        }
    },

    resetUpdateUI(errorMessage) {
        const progContainer = document.getElementById('update-progress-container');
        const statusText = document.getElementById('status-text');
        const statusDot = document.querySelector('.status-dot');
        const backupBtn = document.getElementById('backup-btn');

        // Прячем полоску загрузки
        if (progContainer) progContainer.style.display = "none";
        
        // Выводим текст ошибки
        if (statusText) {
            statusText.style.color = "var(--rose)"; // Цвет ошибки в Rose Pine
            statusText.innerText = errorMessage;
        }

        // Меняем точку на красную (цвет --love в Rose Pine)
        if (statusDot instanceof HTMLElement) {
            statusDot.style.background = "var(--love)";
            statusDot.style.boxShadow = "0 0 8px var(--love)";
        }

        // Возвращаем кнопку бэкапа в рабочее состояние (если она была заблокирована)
        if (backupBtn instanceof HTMLButtonElement) {
            backupBtn.disabled = false;
            backupBtn.innerHTML = `<span class="material-symbols-rounded">inventory_2</span> BACKUP`;
        }
        
        // Через 5 секунд возвращаем стандартный текст
        setTimeout(() => {
            if (statusText) {
                statusText.style.color = ""; 
                statusText.innerText = "GameVault готов";
            }
            if (statusDot instanceof HTMLElement) {
                statusDot.style.background = "var(--foam)";
                statusDot.style.boxShadow = "0 0 5px var(--foam)";
            }
        }, 5000);
    },

    async loadLibrary() {
        App.showDashboard();
        Elements.listContainer?.classList.add('loading');

        const games = await pywebview.api.get_games();
        
        setTimeout(() => {
            if (Elements.listContainer) Elements.listContainer.innerHTML = '';

            const steamGames = games.filter(g => g.source === 'steam');
            const localGames = games.filter(g => g.source === 'local');

            const renderGroup = (title, groupGames) => {
                if (groupGames.length > 0) {
                    const header = document.createElement('div');
                    header.className = 'list-section-title';
                    header.innerText = title;
                    Elements.listContainer?.appendChild(header);

                    groupGames.forEach(game => {
                        const btn = document.createElement('button');
                        btn.className = 'nav-btn';
                        btn.innerText = game.name;
                        btn.onclick = (e) => UI.selectGame(game, e.target); 
                        Elements.listContainer?.appendChild(btn);
                    });
                }
            };

            renderGroup('Steam', steamGames);
            renderGroup('Локальные', localGames);
            Elements.listContainer?.classList.remove('loading');
        }, 300);
    },

    async showDashboard() {
        State.currentView = 'dashboard';
        Elements.dashboard && (Elements.dashboard.style.display = 'flex');
        Elements.gameView && (Elements.gameView.style.display = 'none');
        Elements.loader && (Elements.loader.style.display = 'none');
        UI.setActiveNav('nav-home');

        const stats = await pywebview.api.get_dashboard_stats();
        const stat_total_games = document.getElementById('stat-total-games');
        const stat_total_size = document.getElementById('stat-total-size');
        
        
        if (stat_total_games) stat_total_games.innerText = stats.total_games;
        if (stat_total_size) stat_total_size.innerText = stats.total_backups_size;
    },

    bindGlobalEvents() {
        window.onclick = (e) => {
            if (e.target instanceof HTMLElement && e.target.classList.contains('modal')) {
                if (e.target.id === 'settings-modal') UI.modals.close('settings-modal');
                if (e.target.id === 'history-modal') UI.modals.close('history-modal');
            }
        };

        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (Elements.settingsModal?.style.display === 'flex') UI.modals.close('settings-modal');
                if (Elements.historyModal?.style.display === 'flex') UI.modals.close('history-modal');
            }
        });
    }
};

const UI = {
    setActiveNav(activeId) {
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        if (activeId) document.getElementById(activeId)?.classList.add('active');
    },

    async selectGame(game, element) {
        State.currentView = 'game';
        const loadingId = game.id;

        Elements.dashboard && (Elements.dashboard.style.display = 'none');

        UI.setActiveNav(null); 
        element?.classList.add('active');

        State.selectedGameId = game.id;
        State.activeGameName = game.name;
        State.activeInstallPath = game.install_path;

        const details = await pywebview.api.get_game_details(game.id);

        if (State.currentView !== 'game' || State.selectedGameId !== loadingId) return;

        UI.updateGameUI(game, details, State.HERO_PLACEHOLDER);

        if (Elements.gameView) {
            Elements.gameView.style.display = 'block';
            // Elements.gameView.style.animation = 'fadeIn 0.5s ease';
        }

        if (game.steam_id) {
            const steamHeroUrl = `https://cdn.cloudflare.steamstatic.com/steam/apps/${game.steam_id}/library_hero.jpg`;
            
            Utils.validateHeroImage(steamHeroUrl).then(validUrl => {
                if (State.selectedGameId === loadingId && State.currentView === 'game') {
                    UI.applyHeroImage(validUrl);
                }
            });

            const logoUrl = `https://cdn.cloudflare.steamstatic.com/steam/apps/${game.steam_id}/logo.png`;
            Utils.preloadImage(logoUrl).then(() => {
                if (State.selectedGameId === loadingId && State.currentView === 'game') {
                    const logo = Elements.gameLogo;
                    const titleFallback = Elements.gameTitle;

                    // Проверяем, реально ли загрузилась картинка (не 404)
                    const img = new Image();
                    img.src = logoUrl;
                    img.onload = () => {
                        if (logo instanceof HTMLImageElement) {
                            logo.src = logoUrl;
                            logo.style.opacity = '1'; // Показываем лого
                            logo.style.display = 'block';
                            if (titleFallback) titleFallback.innerText = ''; // УДАЛЯЕМ ТЕКСТ
                        }
                    };
                    img.onerror = () => {
                        // Если картинки нет, оставляем текст и скрываем ломаное лого
                        if (logo) logo.style.display = 'none';
                        if (titleFallback) titleFallback.innerText = game.name;
                    };
                }
            });
        }
    
    },

    applyHeroImage(url) {
        const bg = Elements.heroBg;
        if (!bg) return;

        // transition
        bg.style.opacity = '0';

        setTimeout(() => {
            const bgColor = 'var(--bg, var(--base))';
            bg.style.backgroundImage = `
                linear-gradient(to top, ${bgColor} 5%, transparent 90%), 
                linear-gradient(to right, ${bgColor} 0%, transparent 70%), 
                url("${url}")`;
            bg.style.opacity = '1';
        }, 250);
    },

    updateGameUI(game, details, heroUrl) {
        const bg = Elements.heroBg;
        const logo = Elements.gameLogo;
        const titleFallback = Elements.gameTitle;
        
        if (bg) {
            const bgColor = 'var(--bg, var(--base))';
            bg.style.backgroundImage = `linear-gradient(to top, ${bgColor} 5%, transparent 90%), linear-gradient(to right, ${bgColor} 0%, transparent 70%), url("${heroUrl}")`;
            bg.style.opacity = '1';
        }

        if (logo) {
            logo.style.opacity = '0';
        }

        if (titleFallback) {
            titleFallback.innerText = game.name;
        }
        


        // other

        if (Elements.detailsText) {
            Elements.detailsText.innerText = `ID: ${game.id || 'N/A'}`;
        }

        const sourceBadge = Elements.gameSourceBadge;
        if (sourceBadge) sourceBadge.innerText = game.source === 'steam' ? 'Steam' : 'Local';
        
        const saveSize = Elements.gameBackupSaveSize;
        if (details && saveSize) {
            saveSize.innerText = details.size;
            State.currentBackups = details.backups;
            UI.renderHistory(details.backups);
        }
    },

    renderHistory(backups) {
        const list = Elements.historyList
        if (!list) return;
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
                <button class="simple-icon-btn" onclick="Actions.deleteBackup('${b.path.replace(/\\/g, '/')}')">
                    <span class="material-symbols-rounded">delete</span>
                </button>`;
            list.appendChild(item);
        });
    },

    modals: {
        open(id) {
            const m = document.getElementById(id);
            if (!m) return;
            if (id === 'history-modal') UI.renderHistory(State.currentBackups);
            m.style.display = 'flex';
            setTimeout(() => m.classList.add('show'), 10);
        },
        close(id) {
            const m = document.getElementById(id);
            if (!m) return;
            m.classList.add('closing');
            m.onanimationend = () => {
                if (m.classList.contains('closing')) {
                    m.style.display = 'none';
                    m.classList.remove('closing', 'show');
                }
            };
        }
    }
};

const Actions = {
    async play() {
        if (!State.selectedGameId) return;
        const success = await pywebview.api.play_game(State.selectedGameId);
        if (!success) alert("Не удалось запустить игру.");
    },

    async openGameFolder() {
        if (!State.activeInstallPath) {
            alert("Путь к игре не определен");
            return;
        }
        
        await pywebview.api.open_folder(State.activeInstallPath);
        console.log("Команда на открытие папки игры отправлена");
    },

    async openBackupFolder() {
        if (!State.activeGameName) return;

        const success = await pywebview.api.open_backup_folder(State.activeGameName);
        if (!success) {
             console.warn("Папка бэкапов еще не создана или не найдена");
        }
    },

    async backup() {
        if (!State.selectedGameId) return;
        
        if (Elements.progressContainer) {
            Elements.progressContainer.classList.remove('closing');
            Elements.progressContainer.style.display = 'block';
        }
        if (Elements.progressBar) Elements.progressBar.style.width = '0%';
        if (Elements.backupBtn) {
            Elements.backupBtn.setAttribute('disabled', 'true');
            Elements.backupBtn.innerHTML = `<span class="material-symbols-rounded">sync</span> Сжатие...`;
        }
        pywebview.api.start_backup(State.selectedGameId);
    },

    async deleteBackup(filePath) {
        if (confirm("Удалить этот бэкап навсегда?")) {
            const success = await pywebview.api.delete_backup(filePath);
            if (success) {
                const details = await pywebview.api.get_game_details(State.selectedGameId);
                UI.renderHistory(details.backups);
            }
        }
    },

    async addPath() {
        const response = await pywebview.api.select_folder();
        if (response.status === "success") {
            App.loadLibrary();
            if (Elements.settingsModal?.style.display === 'flex') Actions.openSettings();
        }
    },

    async removePath(path) {
        if (confirm("Перестать сканировать эту папку?")) {
            const success = await pywebview.api.remove_folder(path);
            if (success) { Actions.openSettings(); App.loadLibrary(); }
        }
    },

    async openSettings() {
        const settings = await pywebview.api.get_settings();
        const pathList = document.getElementById('settings-path-list');
        if (pathList) {
            pathList.innerHTML = settings.non_steam_paths.length ? '' : '<p class="muted-text">Папки не добавлены</p>';
            settings.non_steam_paths.forEach(path => {
                const item = document.createElement('div');
                item.className = 'path-item';
                item.innerHTML = `<span>${path}</span>
                    <button class="simple-icon-btn" onclick="Actions.removePath('${path.replace(/\\/g, '/')}')">
                        <span class="material-symbols-rounded">delete</span>
                    </button>`;
                pathList.appendChild(item);
            });
        }
        UI.modals.open('settings-modal');
    },

    openWiki() {
        if (State.activeGameName) {
            const url = `https://www.pcgamingwiki.com/wiki/${encodeURIComponent(State.activeGameName)}`;
            window.open(url, '_blank');
        } else {
            console.warn("Невозможно открыть Wiki: имя игры не определено");
        }
    },
};

const Utils = {
    /** @param {string | null} url @returns {Promise<void>} */
    preloadImage(url) {
        return new Promise((resolve) => {
            if (!url) return resolve();
            const img = new Image();
            img.onload = img.onerror = () => resolve();
            img.src = url;
        });
    },

    validateHeroImage(url) {
        return new Promise((resolve) => {
            if (!url) return resolve(State.HERO_PLACEHOLDER); 
            const img = new Image();
            img.onload = () => resolve(url);
            img.onerror = () => resolve(State.HERO_PLACEHOLDER);
            img.src = url;
        });
    }
};

const WindowControl = {
    initSidebarResizer() {
        const resizer = Elements.sidebarResizer;
        const sidebar = Elements.sidebar;

        if (!resizer || !sidebar) return;

        // Восстанавливаем ширину из памяти сразу при инициализации
        const savedWidth = localStorage.getItem('sidebar-width');
        if (savedWidth) sidebar.style.flexBasis = savedWidth;

        resizer.addEventListener('mousedown', (e) => {
            e.preventDefault();
            document.body.classList.add('resizing-active');

            const onMouseMove = (me) => {
                // me.clientX — это расстояние от левого края окна
                let newWidth = me.clientX;

                // Ограничения
                if (newWidth >= 200 && newWidth <= 500) {
                    sidebar.style.flexBasis = newWidth + 'px';
                }
            };

            const onMouseUp = () => {
                document.body.classList.remove('resizing-active');
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
                
                // Сохраняем результат в локальное хранилище браузера
                localStorage.setItem('sidebar-width', sidebar.style.flexBasis);
            };

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });
    },

    initResizing() {
        const resizers = {
            'r': document.getElementById('resizer-r'),
            'b': document.getElementById('resizer-b'),
            'rb': document.getElementById('resizer-rb')
        };

        const handleMouseDown = (e, direction) => {
            State.isResizing = true;
            const startX = e.clientX, startY = e.clientY;
            const startW = window.innerWidth, startH = window.innerHeight;

            const onMouseMove = (me) => {
                if (!State.isResizing) return;
                let newW = startW, newH = startH;
                if (direction.includes('r')) newW = startW + (me.clientX - startX);
                if (direction.includes('b')) newH = startH + (me.clientY - startY);
                pywebview.api.resize_window(Math.max(newW, 800), Math.max(newH, 600));
            };

            const onMouseUp = () => {
                State.isResizing = false;
                document.removeEventListener('mousemove', onMouseMove);
            };
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp, { once: true });
        };

        Object.entries(resizers).forEach(([dir, el]) => {
            el?.addEventListener('mousedown', (e) => handleMouseDown(e, dir));
        });
    },

    initTitlebar() {
        const titlebar = document.getElementById('titlebar');
        titlebar?.addEventListener('dblclick', WindowControl.toggleMaximize);
        titlebar?.addEventListener('mousedown', (e) => {
            pywebview.api.get_maximize_status().then(isMaximized => {
                if (isMaximized) {
                    const onMove = (me) => {
                        if (Math.abs(me.screenX - e.screenX) > 5 || Math.abs(me.screenY - e.screenY) > 5) {
                            pywebview.api.simple_restore().then(() => {
                                Elements.maxIcon && (Elements.maxIcon.innerText = 'crop_square');
                            });
                            document.removeEventListener('mousemove', onMove);
                        }
                    };
                    document.addEventListener('mousemove', onMove);
                    document.addEventListener('mouseup', () => document.removeEventListener('mousemove', onMove), { once: true });
                }
            });
        });
    },

    toggleMaximize() {
        pywebview.api.toggle_maximize().then(isMaximized => {
            if (Elements.maxIcon) Elements.maxIcon.innerText = isMaximized ? 'filter_none' : 'crop_square';
        });
    }
};

// @ts-ignore
window.updateUIProgress = (percent) => {
    if (Elements.progressBar) Elements.progressBar.style.width = percent + '%';
    const percentText = document.getElementById('progress-percent');
    if (percentText) percentText.innerText = Math.round(percent) + '%';
};

// @ts-ignore
window.onBackupComplete = (result) => {
    setTimeout(() => {
        if (Elements.progressContainer) {
            Elements.progressContainer.classList.add('closing');
            Elements.progressContainer.onanimationend = () => {
                if (Elements.progressContainer?.classList.contains('closing')) {
                    Elements.progressContainer.style.display = 'none';
                    Elements.progressContainer.classList.remove('closing');
                    if (Elements.backupBtn) {
                        Elements.backupBtn.removeAttribute('disabled');
                        Elements.backupBtn.innerHTML = `<span class="material-symbols-rounded">inventory_2</span> BACKUP`;
                    }

                    pywebview.api.get_game_details(State.selectedGameId).then(details => {
                        if (details) {
                            State.currentBackups = details.backups;
                            UI.renderHistory(State.currentBackups); 

                            const saveSize = document.getElementById('save-size');
                            if (saveSize) saveSize.innerText = details.size;
                        }
                    });
                }
            };
        }
    }, 1000);
};

window.addEventListener('pywebviewready', App.init);