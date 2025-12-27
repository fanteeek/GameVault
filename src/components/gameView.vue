<script setup lang="ts">
import { computed, watch } from 'vue';
import { useGamesStore } from '../stores/games';
import { useUiStore } from '../stores/ui';
import api from '../api';
import GameNews from './gamenews.vue';

const gamesStore = useGamesStore();
const uiStore = useUiStore();

const game = computed(() => gamesStore.activeGame);

watch(game, (newGame) => {
    if (newGame) {
        uiStore.loadGameAssets(newGame);
    }
}, { immediate: true });

const heroStyle = computed(() => {
    const url = uiStore.heroImageUrl || uiStore.heroPlaceholder;
    return {
        backgroundImage: `
        linear-gradient(to top, var(--base) 5%, transparent 90%), 
        linear-gradient(to right, var(--base) 0%, transparent 70%), 
        url("${url}")
        `,
        opacity: 1
    };
});

const gameLogoUrl = computed(() => uiStore.gameLogoUrl);
const handleLogoError = () => {
    uiStore.gameLogoUrl = null;
};

// Actions
const openFolder = async () => {
    if (game.value?.install_path) {
        await api.openFolder(game.value.install_path);
    }
};

const openWiki = () => {
    if (game.value?.name) {
        const url = `https://www.pcgamingwiki.com/wiki/${encodeURIComponent(game.value.name)}`;
        window.open(url, '_blank');
    }
};
</script>

<template>
    <div id="game-view" class="view" v-if="game">
        <div id="hero-section">
            <div id="hero-bg" :style="heroStyle"></div>

            <div class="hero-content">
                <img
                    v-if="gameLogoUrl"
                    id="game-logo"
                    :src="gameLogoUrl"
                    alt="Logo"
                    @error="handleLogoError"
                    style="display: block; opacity: 1;"
                >
                <h1 v-else id="game-title-fallback">{{ game.name }}</h1>

                <div style="display: flex; gap: 6px;">
                    <div class="action-dock">
                        <button
                            class="primary-btn"
                            id="play-btn"
                            :class="{ 'running': gamesStore.isGameRunning }"
                            @click="gamesStore.playActiveGame()">
                            <span class="material-symbols-rounded">
                                {{ gamesStore.isGameRunning ? 'stop_circle' : 'play_arrow' }}
                            </span>
                            {{ gamesStore.isGameRunning ? 'Close' : 'Play' }}
                        </button>
                        
                        <button class="secondary-btn" @click="gamesStore.createBackup()" title="Backup" :disabled="uiStore.isBackupRunning">
                            <span class="material-symbols-rounded" :class="{ 'spin-icon': uiStore.isBackupRunning }">
                                {{ uiStore.isBackupRunning ? 'sync' : 'inventory_2' }}
                            </span>
                            {{ uiStore.isBackupRunning ? 'Going Backup' : 'Backup' }}
                        </button>

                        <button class="secondary-btn" @click="openFolder" title="Game Folder">
                            <span class="material-symbols-rounded">folder_open</span>
                        </button>

                        <button class="secondary-btn" @click="uiStore.isHistoryOpen = true" title="History">
                            <span class="material-symbols-rounded">history</span>
                        </button>
                    </div>

                    <div class="action-dock">
                        <button class="secondary-btn" @click="openWiki" title="Wiki">
                            <span class="material-symbols-rounded">language</span> PCGamingWiki
                        </button>
                    </div>
                </div>
            </div>

        </div>
        
        <div id="progress-container" v-if="uiStore.isBackupRunning">
                <div class="progress-info">
                    <span>Creating backup...</span>
                    <span id="progress-percent">{{ Math.round(uiStore.backupProgress) }}%</span>
                </div>
                <div class="progress-track">
                    <div id="progress-bar-fill" :style="{ width: uiStore.backupProgress + '%' }"></div>
                </div>
        </div>

        <div id="game-stats-row">
            <div class="info-block">
                <label>Save Weight</label>
                <span id="save-size">{{ gamesStore.activeGameSize }}</span>
            </div>
            <div class="info-divider"></div>
            <div class="info-block">
                <label>Source</label>
                <span class="badge">{{ game.source === 'steam' ? 'STEAM' : 'LOCAL' }}</span>
            </div>
            <div class="info-divider"></div>
            <div class="info-block">
                <label>ID</label>
                <span>{{ game.id }}</span>
            </div>
        </div>

        <GameNews />
    </div>
</template>

<style scoped>
#game-view {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
    overflow-y: auto;
    background: var(--base);
}

#hero-section {
    position: relative;
    height: 400px;
    width: 100%;
    flex-shrink: 0;
    background: var(--base);
    overflow: hidden;
}

#hero-bg {
    position: absolute;
    inset: 0;
    background-size: cover;
    background-position: center;
    transition: opacity 0.5s ease-in-out;
    z-index: 0;
    mask-image: radial-gradient(white, black); 
    -webkit-mask-image: -webkit-radial-gradient(white, black);
}

.hero-content {
    position: relative;
    z-index: 2;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: flex-end; 
    align-items: flex-start;
    padding: 0 20px 30px;
    gap: 20px;
}

#game-logo {
    max-width: 500px;
    max-height: 260px;
    object-fit: contain;
    transition: opacity 0.3s ease;
}

#game-title-fallback {
    font-size: 48px;
    font-weight: 800;
    color: var(--text);
    text-shadow: 0 2px 10px rgba(0,0,0,0.8);
    margin: 0;
    line-height: 1.1;
}

.action-dock {
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(31, 29, 46, 0.6);
    backdrop-filter: blur(12px);
    padding: 6px;
    border-radius: 14px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

#progress-container {
    margin: 0 40px 20px 40px;
    padding: 20px;
    background: var(--surface);
    border-radius: 14px;
    border: 1px solid var(--highlight-high);
    animation: fadeIn 0.4s ease;
}

.progress-info {
    display: flex;
    justify-content: space-between;
    margin-bottom: 10px;
    font-size: 13px;
    font-weight: 600;
    color: var(--text);
}

.progress-track {
    height: 8px;
    background: var(--overlay);
    border-radius: 10px;
    overflow: hidden;
}

#progress-bar-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--iris), var(--foam));
    width: 0%;
    transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.spin-icon {
    animation: spin 1s linear infinite;
}

.primary-btn {
    height: 48px;
    padding: 0px 32px;
}

.primary-btn.running {
    background: var(--love) !important;
    box-shadow: 0 0 15px rgba(235, 111, 146, 0.3);
    animation: pulse-red 2s infinite;
}

.primary-btn.running:hover {
    box-shadow: 0 0 25px rgba(235, 111, 146, 0.6);
}

.secondary-btn {
    padding: 0px 10px;
}

#game-stats-row {
    margin: 0px 20px;
    display: flex;
    align-items: center;
    padding: 20px 25px;
    background: var(--surface);
    border-radius: 16px;
    border: 1px solid var(--highlight-high);
    gap: 20px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.info-block {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.info-block label {
    font-size: 10px;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 1px;
    font-weight: 700;
}

.info-block span {
    font-size: 18px;
    color: var(--text);
    font-weight: 600;
}

#save-size {
    color: var(--foam);
    font-family: monospace;
}

.info-divider {
    width: 1px;
    height: 35px;
    background: var(--highlight-high);
    opacity: 0.5;
}

.badge {
    background: var(--overlay);
    color: var(--subtle) !important;
    padding: 4px 10px;
    border-radius: 6px;
    border: 1px solid var(--highlight-high);
    font-size: 11px !important;
    text-transform: uppercase;
    font-weight: bold;
    display: inline-block;
    width: fit-content;
}

@keyframes spin { 100% { transform: rotate(360deg); } }

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
}

@keyframes pulse-red {
    0% { box-shadow: 0 0 10px rgba(235, 111, 146, 0.4); }
    50% { box-shadow: 0 0 25px rgba(235, 111, 146, 0.7); }
    100% { box-shadow: 0 0 10px rgba(235, 111, 146, 0.4); }
}
</style>