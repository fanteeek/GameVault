import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { Game, Settings, UpdateInfo } from '../types';
import api from '../api';
import placeholderImg from '../assets/hero_placeholder.jpg';

export const useUiStore = defineStore('ui', () => {
    // Nav
    const currentView = ref<'dashboard' | 'game'>('dashboard');

    // Modal
    const isSettingsOpen = ref(false);
    const isHistoryOpen = ref(false);

    // State Window
    const isMaximized = ref(false);

    // Updates
    const updateInfo = ref<UpdateInfo | null>(null);
    const updateStatusText = ref<string | null>(null);
    const updateProgress = ref(0);
    const appVersion = ref<string | null>(null);
    const updateHasError = ref(false);
    const isUpdating = ref(false);

    // Settings
    const settings = ref<Settings>({ non_steam_paths: [], backup_root: ''});

    // Hero/Logo
    const heroPlaceholder = placeholderImg;
    const heroImageUrl = ref<string | null>(null);
    const gameLogoUrl = ref<string | null>(null);

    // Actions /////////////////////////////////////////
    function showDashboard() {
        currentView.value = 'dashboard';
    }

    function showGameView(){
        currentView.value = 'game';
    }

    // Load Pictures for Games
    async function loadGameAssets(game: Game) {
        heroImageUrl.value = heroPlaceholder;
        gameLogoUrl.value = null;

        if (game.steam_id) {
            const steamHeroUrl = `https://cdn.cloudflare.steamstatic.com/steam/apps/${game.steam_id}/library_hero.jpg`;
            const isValid = await validateImage(steamHeroUrl);
            heroImageUrl.value = isValid ? steamHeroUrl : heroPlaceholder;

            // 2. Пытаемся загрузить Лого
            const steamLogoUrl = `https://cdn.cloudflare.steamstatic.com/steam/apps/${game.steam_id}/logo.png`;
            const isLogoValid = await validateImage(steamLogoUrl);
            if (isLogoValid) {
                gameLogoUrl.value = steamLogoUrl;
            }
        }
    }

    function validateImage(url: string): Promise<boolean> {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
            img.src = url;
        });
    }

    // Window Managment
    async function initWindowControls() {
        isMaximized.value = await api.getMaximizeStatus();
    }

    async function toggleMaximize() {
        isMaximized.value = await api.toggleMaximize();
    }
    
    async function minimize() {
        await api.minimizeWindow();
    }

    async function closeApp() {
        await api.closeWindow();
    }

    // Settings
    async function loadSettings() {
        settings.value = await api.getSettings();
    }

    async function addScanPath() {
        const success  = await api.addPath();
        if (success) await loadSettings();
    }

    async function removeScanPath(path:string) {
        const success = await api.removePath(path);
        if (success) await loadSettings();
    }

    // Updates
    async function checkUpdates() {
        updateStatusText.value = 'Check for Updates...';
        try {
            const info = await api.checkUpdates();
            if (info && info.error) {
                updateHasError.value = true;
                updateStatusText.value = 'Update check failed';
                console.warn('Update check error:', info.error);
                return;
            }
            
            updateHasError.value = false;

            if (info && info.update_available) {
                updateInfo.value = info;
                updateStatusText.value = `Available ${info.latest_version}`;
            } else {
                updateStatusText.value = 'Up to date';
            }
        } catch (e) {
            updateStatusText.value = 'Connection error';
            console.error(e);
        }
            
        
    }

    async function startUpdate() {
        if (updateInfo.value?.download_url) {
            isUpdating.value = true;
            updateStatusText.value = 'Starting download...';
            await api.startUpdate(updateInfo.value.download_url);
        }
    }

    async function getAppVersion() {
        appVersion.value = await api.getAppVersion();
    }

    return {
        currentView,
        isHistoryOpen,
        // Window
        initWindowControls,
        isMaximized,
        toggleMaximize,
        minimize,
        closeApp,
        // Update
        checkUpdates,
        startUpdate,
        updateInfo,
        updateStatusText,
        updateProgress,
        updateHasError,
        isUpdating,
        appVersion,
        getAppVersion,
        // Settings
        settings,
        isSettingsOpen,
        loadSettings,
        addScanPath,
        removeScanPath,
        // GameView
        loadGameAssets,
        heroImageUrl,
        heroPlaceholder,
        gameLogoUrl,
        showGameView,
        // Dashboard
        showDashboard
    };
})