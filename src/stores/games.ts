import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '../api';
import type { Game, DashboardData, Backup, GameNewsItem } from '../types'

export const useGamesStore = defineStore('games', () => {
    // STATES
    const allGames = ref<Game[]>([]);
    const dashboardData = ref<DashboardData | null>(null);
    const activeGameId = ref<string | null>(null);
    const activeGameBackups = ref<Backup[]>([]);
    const activeGameSize = ref<string>('0 B');
    const activeGameNews = ref<GameNewsItem[]>([]);
    const isGameRunning = ref(false);
    const isLoading = ref(false);

    // GETTERS

    // get active game by id
    const activeGame = computed(() => {
        return allGames.value.find(g => g.id === activeGameId.value) || null;
    });

    const steamGames = computed(() => allGames.value.filter(g => g.source === 'steam'));
    const localGames = computed(() => allGames.value.filter(g => g.source === 'local'));

    // ACTIONS

    // loadLibrary Games
    async function loadLibrary() {
        isLoading.value = true;
        try {
            console.log("Try get Games from Python...");
            allGames.value = await api.getGames();
            await new Promise(resolve => setTimeout(resolve, 300));
            console.log("Games taken:", allGames.value.length);
        } catch (e) {
            console.error("Failed to load games", e);
        } finally {
            isLoading.value = false;
        }
    }

    // Load Dashboard
    async function loadDashboard() {
        try {
            dashboardData.value = await api.getDashboardData();
        } catch (e) {
            console.error("Failed to load dashboard", e);
        }
    }

    async function selectGame(gameId:string) {
        activeGameId.value = gameId;
        activeGameBackups.value = [];
        activeGameSize.value = 'Loading...';

        const details = await api.getGameDetails(gameId);
        if (details) {
            activeGameSize.value = details.size;
            activeGameBackups.value = details.backups;
        }

        // Game News
        activeGameNews.value = [];
        const game = allGames.value.find(g => String(g.id) === String(gameId));
        if (game && game.steam_id) {
            api.getGameNews(game.steam_id).then(news => {
                if (activeGameId.value === gameId) {
                    activeGameNews.value = news;
                }
            });
        }
    }

    // Play Game
    async function playActiveGame() {
        if (!activeGameId.value) return;
        if (isGameRunning.value) {
            await api.stopGame();
            isGameRunning.value = false;
        } else {
            const success = await api.play(activeGameId.value);
            if (success) isGameRunning.value = true;
        }
    }

    // Create Backup
    async function createBackup() {
        if (!activeGameId.value) return;

        await api.backup(activeGameId.value);
        await selectGame(activeGameId.value);
    }
    
    async function deleteBackup(path:string) {
        if (!activeGameId.value) return;
        const success = await api.deleteBackup(path);
        if (success) {
            await selectGame(activeGameId.value);
        }
    }

    return {
        allGames,
        dashboardData,
        activeGameId,
        activeGame,
        activeGameBackups,
        activeGameSize,
        activeGameNews,
        isGameRunning,
        isLoading,
        steamGames,
        localGames,
        loadLibrary,
        loadDashboard,
        selectGame,
        playActiveGame,
        createBackup,
        deleteBackup
    };
});