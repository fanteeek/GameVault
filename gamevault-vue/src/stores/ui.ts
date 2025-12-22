import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '../api';
import type { Settings, UpdateInfo } from '../types';

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
    const updateStatusText = ref('Check for Updates...')
    const updateProgress = ref(0);

    // Settings
    const settings = ref<Settings>({ non_steam_paths: [], backup_root: ''});

    // Actions
    function showDashboard() {
        currentView.value = 'dashboard';
    }

    function showGameView(){
        currentView.value = 'game';
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
        updateStatusText.value = 'Checking...';
        const info = await api.checkUpdates();
        if (info && info.update_available) {
            updateInfo.value = info;
            updateStatusText.value = `Available v${info.latest_version}`;
        } else {
            updateStatusText.value = 'Up to date';
        }
    }

    async function startUpdate() {
        if (updateInfo.value?.download_url) {
            updateStatusText.value = 'Loading...';
            await api.startUpdate(updateInfo.value.download_url);
        }
    }

    return {
        currentView,
        isSettingsOpen,
        isHistoryOpen,
        isMaximized,
        updateInfo,
        updateStatusText,
        updateProgress,
        settings,
        showDashboard,
        showGameView,
        toggleMaximize,
        minimize,
        closeApp,
        loadSettings,
        addScanPath,
        removeScanPath,
        checkUpdates,
        startUpdate,
        initWindowControls
    };
})