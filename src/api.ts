import type { Game, DashboardData, Settings, UpdateInfo } from './types';

const isPyWebViewReady = ():boolean => typeof window.pywebview !== 'undefined';

export const api = {

    // Updates
    async getAppVersion(): Promise<string> {
        if (!isPyWebViewReady()) return "DEV";
        return await window.pywebview.api.get_app_version();
    },

    async checkUpdates(): Promise<UpdateInfo> {
        if (!isPyWebViewReady()) return { update_available: false };
        return await window.pywebview.api.check_updates();
    },

    async startUpdate(url: string): Promise<void> {
        if(!isPyWebViewReady()) {
            console.log('Update started for:', url);
            return;
        }
        return await window.pywebview.api.start_update(url);
    },

    // Games

    async getGames(): Promise<Game[]> {
        if (!isPyWebViewReady()) return [];
        return await window.pywebview.api.get_games();
    },

    async getGameDetails(gameId: string): Promise<any> {
        if (!isPyWebViewReady()) return null;
        return await window.pywebview.api.get_game_details(gameId);
    },

    async getGameAssets(gameId: string, steamId: string | null = null) {
        if (!isPyWebViewReady()) return { hero: null, logo: null };
        return await window.pywebview.api.get_game_assets(gameId, steamId || "");
    },

    async play(gameId: string): Promise<boolean> {
        if (!isPyWebViewReady()) {
            console.log('Playing game:', gameId);
            return true;
        }
        return await window.pywebview.api.play_game(gameId);
    },

    // Game Backup
    async stopGame(): Promise<void> {
        if (!isPyWebViewReady()) return;
        return await window.pywebview.api.stop_game();
    },

    async backup(gameId: string): Promise<any> {
        if (!isPyWebViewReady()) return { status: 'simulated' };
        return await window.pywebview.api.start_backup(gameId);
    },

    async deleteBackup(filePath: string): Promise<boolean> {
        if (!isPyWebViewReady()) return true;
        return await window.pywebview.api.delete_backup(filePath);
    },

    // Folders

    async openFolder(path: string): Promise<boolean> {
        if (!isPyWebViewReady()) return true;
        return await window.pywebview.api.open_folder(path);
    },

    async openBackupFolder(gameName: string): Promise<void> {
        if (!isPyWebViewReady()) return;
        return await window.pywebview.api.open_backup_folder(gameName);
    },

    // Settings

    async getSettings(): Promise<Settings> {
        if (!isPyWebViewReady()) return { non_steam_paths: [], backup_root: 'default' };
        return await window.pywebview.api.get_settings();
    },

    async addPath(): Promise<boolean> {
        if (!isPyWebViewReady()) return false;
        return await window.pywebview.api.select_folder();
    },

    async removePath(path: string): Promise<boolean> {
        if (!isPyWebViewReady()) return false;
        return await window.pywebview.api.remove_folder(path);
    },

    // Окна
    async minimizeWindow(): Promise<void> {
        if (!isPyWebViewReady()) return;
        await window.pywebview.api.minimize_window();
    },

    async closeWindow(): Promise<void> {
        if (!isPyWebViewReady()) return;
        await window.pywebview.api.close_window();
    },

    async toggleMaximize(): Promise<boolean> {
        if (!isPyWebViewReady()) return false;
        return await window.pywebview.api.toggle_maximize();
    },

    async simpleRestore(): Promise<boolean> {
        if (!isPyWebViewReady()) return false;
        return await window.pywebview.api.simple_restore();
    },

    async getMaximizeStatus(): Promise<boolean> {
        if (!isPyWebViewReady()) return false;
        return await window.pywebview.api.get_maximize_status();
    },

    async resizeWindow(width: number, height: number): Promise<void> {
        if (!isPyWebViewReady()) return;
        await window.pywebview.api.resize_window(width, height);
    },

    // Dashboard
    async getDashboardData(): Promise<DashboardData> {
        if (!isPyWebViewReady()) return { user_name: 'Dev', total_games: 0, total_size: 0, recent_activity: [], carousel_games: [] };
        return await window.pywebview.api.get_dashboard_data();
    },
};

export default api;
