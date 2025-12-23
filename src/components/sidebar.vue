<template>
    <aside class="sidebar">
        <div class="library-header">
            <span>LIBRARY</span>
            <div class="header-actions">
                <button
                    @click="gamesStore.loadLibrary()"
                    class="simple-icon-btn"
                    :class="{ 'spinning': gamesStore.isLoading }"
                    :disabled="gamesStore.isLoading"
                    title="Refresh">
                    <span class="material-symbols-rounded">refresh</span>
                </button>

                <button 
                    @click="uiStore.isSettingsOpen = true"
                    class="simple-icon-btn"
                    title="Settings">
                    <span class="material-symbols-rounded">settings</span>
                </button>
            </div>
        </div>

        <div class="search-container">
            <span class="material-symbols-rounded search-icon">search</span>
            <input type="text" id="game-search" placeholder="Search..." v-model="searchQuery">
        </div>

        <div id="game-list">
            <!-- Steam -->
            <div class="list-section-title" v-if="filteredSteamGames.length">Steam</div>
            <button
                v-for="game in filteredSteamGames"
                :key="game.id" class="nav-btn game-item"
                :class="{ active: gamesStore.activeGameId === game.id }"
                @click="selectGame(game.id)">

                <div class="game-icon-wrapper">
                    <img
                        v-if="game.local_icon"
                        :src="game.local_icon"
                        alt=""
                        class="game-list-icon">
                    <div v-else class="game-list-icon" style="background: #333"></div>
                </div>
                <span class="game-title">{{ game.name }}</span>
            </button>

            <!-- Local -->
             <div v-if="filteredLocalGames.length" class="list-section-title">Local</div>
             <button
                v-for="game in filteredLocalGames"
                :key="game.id"
                class="nav-btn game-item"
                :class="{ acitve: gamesStore.activeGameId === game.id}"
                @click="selectGame(game.id)">

                <div class="game-icon-wrapper">
                    <img v-if="game.local_icon" :src="game.local_icon" alt="" class="game-list-icon">
                </div>
                <span class="game-title">{{ game.name }}</span>
            </button>
        </div>
    </aside>
</template>

<script setup lang="ts">
    import { ref, computed } from 'vue';
    import { useGamesStore } from '../stores/games';
    import { useUiStore } from '../stores/ui';
    import type { Game } from '../types';

    const gamesStore = useGamesStore();
    const uiStore = useUiStore();
    const searchQuery = ref('');

    // Filter
    const filteredSteamGames = computed(() => {
        return gamesStore.steamGames.filter((g: Game) =>
            g.name.toLowerCase().includes(searchQuery.value.toLowerCase())
        );
    });

    const filteredLocalGames = computed(() => {
        return gamesStore.localGames.filter((g: Game) =>
            g.name.toLowerCase().includes(searchQuery.value.toLowerCase())
        );
    });

    function selectGame(id:string) {
        gamesStore.selectGame(id);
        uiStore.showGameView();
    }
</script>

    
<style scoped>
    .sidebar {
        height: 100%;
        display: flex;
        flex-direction: column;
        background: var(--base);
        border-right: 1px solid var(--highlight-high);
        padding: 10px 0; 
        overflow: hidden;
    }

    .library-header {
        font-size: 11px;
        color: var(--muted);
        margin: 10px 14px 5px;
        padding-bottom: 8px;
        letter-spacing: 1px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-shrink: 0;
    }

    .header-actions {
        display: flex;
        gap: 8px;
    }

    .search-container {
        margin: 0 10px 15px 10px;
        position: relative;
        display: flex;
        align-items: center;
        flex-shrink: 0;
    }

    .search-icon {
        position: absolute;
        left: 10px;
        font-size: 18px;
        color: var(--muted);
        pointer-events: none;
    }

    #game-search {
        width: 100%;
        background: var(--overlay);
        border: 1px solid var(--highlight-high);
        border-radius: 8px;
        padding: 8px 12px 8px 35px;
        color: var(--text);
        font-size: 13px;
        outline: none;
        transition: border-color 0.2s;
    }

    #game-search:focus {
        border-color: var(--iris);
    }

    #game-list {
        flex-grow: 1;
        overflow-y: auto; 
        padding: 0 5px;
        display: flex;
        flex-direction: column;
        gap: 2px;
    }

    .list-section-title {
        font-size: 10px;
        color: var(--muted);
        padding: 15px 10px 5px;
        text-transform: uppercase;
        letter-spacing: 1px;
    }

    .nav-btn {
        width: 100%;
        background: transparent;
        padding: 6px 10px;
        border: none;
        color: var(--text);
        text-align: left;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.1s ease-out;
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 2px;
    }

    .nav-btn:hover {
        background: var(--overlay);
    }

    .nav-btn.active {
        background: var(--surface);
        box-shadow: inset 3px 0 0 var(--iris); 
        color: var(--text);
    }

    .nav-btn.active .game-title {
        color: var(--iris);
        font-weight: 600;
    }

    .game-icon-wrapper {
        width: 28px;
        height: 28px;
        flex-shrink: 0;
        border-radius: 4px;
        overflow: hidden;
        background: var(--overlay);
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .game-list-icon {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .game-title {
        font-size: 13px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .spinning {
        animation: spin 1s linear infinite;
        color: var(--iris);
    }

    @keyframes spin {
        100% { transform: rotate(360deg); }
    }

    #game-list::-webkit-scrollbar { width: 4px; }
    #game-list::-webkit-scrollbar-thumb { background: var(--highlight-high); border-radius: 2px; }
    #game-list::-webkit-scrollbar-thumb:hover { background: var(--iris); }
</style>

  