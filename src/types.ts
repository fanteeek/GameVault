export interface Game {
    id: string;
    name: string;
    steam_id?: string | null;
    install_path: string;
    save_paths: string[];
    source: 'steam' | 'local';
    local_icon?: string | null;
}

export interface Backup {
    name: string;
    game: string;
    size: string;
    date: number;
    path: string;
}

export interface DashboardData {
    user_name: string;
    total_games: number;
    total_size: number;
    recent_activity: Backup[];
    carousel_games: Array<{
        id: string;
        steam_id?: string;
        name: string;
    }>;
}

export interface Settings {
    non_steam_paths: string[];
    backup_root: string;
}

export interface UpdateInfo {
    update_available: boolean;
    latest_version?: string;
    download_url?: string;
    changelog?: string;
}