interface PyWebViewApi {
    // Version & Update
    get_app_version(): Promise<string>;
    check_updates(): Promise<any>;
    start_update(url: string): Promise<void>;

    // Window
    minimize_window(): Promise<void>;
    close_window(): Promise<void>;
    toggle_maximize(): Promise<boolean>;
    simple_restore(): Promise<boolean>;
    get_maximize_status(): Promise<boolean>;
    resize_window(width: number, height: number): Promise<void>;

    // Games
    get_games(): Promise<any[]>;
    get_dashboard_data(): Promise<any>;
    get_game_details(gameId: string): Promise<any>;
    
    // Actions
    play_game(gameId: string): Promise<boolean>;
    stop_game(): Promise<void>;
    start_backup(gameId: string): Promise<any>;
    delete_backup(filePath: string): Promise<boolean>;

    // FileSystem
    open_folder(path: string): Promise<boolean>;
    open_backup_folder(gameName: string): Promise<void>;
    select_folder(): Promise<boolean>;
    remove_folder(path: string): Promise<boolean>;
    get_settings(): Promise<any>;
}

interface Window {
    pywebview: {
        api: PyWebViewApi
    };
    UI: {
        updateListIcon: (gameId: string, iconData: string) => void;
        togglePlayButton: (isRunning: boolean) => void;
        updateDownloadProgress: (percent: number) => void;
        resetUpdateUI: (errorMessage: string) => void;
        updateUIProgress: (percent: number) => void;
        onBackupComplete: (result: string) => void;
    };
}