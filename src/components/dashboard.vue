<script setup lang="ts">
    import { computed } from 'vue';
    import { useGamesStore } from '../stores/games';
    import { useUiStore } from '../stores/ui';
    import placeholderImg from '../assets/hero_placeholder.jpg'; 

    const gamesStore = useGamesStore();
    const uiStore = useUiStore();

    const userName = computed(() => gamesStore.dashboardData?.user_name || 'Gamer');
    const totalGames = computed(() => gamesStore.dashboardData?.total_games || 0);
    const totalSize = computed(() => gamesStore.dashboardData?.total_size || 0);
    const recentActivity = computed(() => gamesStore.dashboardData?.recent_activity || []);

    const carouselGames = computed(() => {
        const games = gamesStore.dashboardData?.carousel_games || [];
        return [...games, ...games];
    });

    const getCarouselImage = (steamId?: string) => {
        if (steamId) {
            return `https://cdn.cloudflare.steamstatic.com/steam/apps/${steamId}/capsule_184x69.jpg`;
        }
        return placeholderImg;
    };

    const selectGame = (id: string) => {
        gamesStore.selectGame(id);
        uiStore.showGameView();
    };
</script>

<template>
    <div id="dashboard-view" class="view">
        <div class="welcome-header">
            <h1>Welcome, <span class="highlight-text">{{ userName }}</span></h1>
            <p class="subtle-text">Here subtle text</p>
        </div>

        <div class="stats-grid">
            <div class="glass-card">
                <div class="stat-card reveal" style="--delay: 0.1s">
                    <div class="stat-icon-box iris-bg">
                        <span class="material-symbols-rounded">library_books</span>
                    </div>
                    <div class="stat-content">
                        <span>{{ totalGames }}</span>
                        <label>Total Games</label>
                    </div>
                </div>
                <div class="stat-card reveal" style="--delay: 0.2s">
                    <div class="stat-icon-box foam-bg">
                        <span class="material-symbols-rounded">cloud_done</span>
                    </div>
                    <div class="stat-content">
                        <span>{{ totalSize }}</span>
                        <label>Total Size</label>
                    </div>
                </div>
            </div>
        </div>

        <!-- Infinite Carousel -->
        <div class="shelf-container reveal" style="--delay: 0.3">
            <h3 class="section-title">Your Library</h3>
            <div class="infinite-carousel">
                <div id="crousel-track" class="carousel-track">
                    <div
                        v-for="(game, index) in carouselGames"
                        :key="game.id + '-' + index"
                        class="carousel-item"
                        @click="selectGame(game.id)"
                        :title="game.name"
                        :style="{ backgroundImage: `url(${getCarouselImage(game.steam_id)})` }">
                    </div>
                </div>
            </div>
        </div>

        <!-- Last Activity -->
        <div class="activit-section reveal" style="--delay: 0.4s">
            <h3 class="section-title">Last Backup</h3>
            <div id="activity-list" class="activity-grid">
                <div v-if="recentActivity.length === 0" class="subtle-text" style="padding: 0 20px;">
                    Backup history is empty
                </div>
                <div class="activity-card" v-for="act in recentActivity" :key="act.path">
                    <div class="activity-info">
                        <h4>{{ act.game }}</h4>
                        <p>{{ new Date(act.date * 1000).toLocaleString() }}</p>
                    </div>
                    <div class="activity-size">{{ act.size }}</div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
    #dashboard-view {
    display: flex;
    flex-direction: column;
    justify-content: flex-start; 
    align-items: flex-start; 
    padding: 40px; 
    height: 100%;
    width: 100%;
    overflow-x: hidden; 
    overflow-y: auto;
    box-sizing: border-box;
    }

    .welcome-header {
    margin-bottom: 30px;
    width: 100%;
    text-align: left;
    }

    .stats-grid {
    display: flex;
    gap: 20px;
    margin-bottom: 30px;
    width: 100%;
    justify-content: flex-start; 
    }

    .shelf-container {
    width: 100%;
    margin-bottom: 30px;
    }

    .infinite-carousel {
    width: 100%;
    overflow: hidden; 
    padding: 10px 0;
    mask-image: linear-gradient(to right, transparent, black 5%, black 95%, transparent);
    -webkit-mask-image: linear-gradient(to right, transparent, black 5%, black 95%, transparent);
    }

    .carousel-track {
    display: flex;
    gap: 15px;
    width: max-content; 
    animation: scroll 40s linear infinite;
    }

    .carousel-track:hover {
    animation-play-state: paused;
    }

    .carousel-item {
    width: 184px;
    height: 69px;
    border-radius: 10px;
    background-size: cover;
    background-position: center;
    transition: transform 0.3s ease;
    cursor: pointer;
    flex-shrink: 0;
    }

    .carousel-item:hover {
    transform: scale(1.05);
    border: 1px solid var(--highlight-high);
    }

    .section-title {
    margin-bottom: 15px;
    font-size: 14px;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 1px;
    }


    @keyframes scroll {
    0% { transform: translateX(0); }
    100% { transform: translateX(-50%); } 
    }

    .glass-card {
    display: flex;
    gap: 20px;
    }

    .stat-card,.activity-card {
    background: var(--surface);
    border: 1px solid var(--highlight-high);
    padding: 15px 25px;
    border-radius: 16px;
    display: flex;
    align-items: center;
    gap: 15px;
    min-width: 200px;
    }

    .activity-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 15px;
    width: 100%;
    }
    
    .activity-section {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    }
    
    .activity-card {
        flex-direction: column;
        align-items: flex-start;
        min-width: 0px;
    }

    .activity-size {
        background: rgba(196, 167, 231, 0.1);
        color: var(--iris);
        padding: 4px 12px;
        border-radius: 6px;
    }

    .stat-icon-box {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    }

    .stat-content {
        display: flex;
        flex-direction: column;
    }

    .stat-content span {
        font-size: 20px;
        font-weight: bold;
        color: var(--text);
    }

    .stat-content label {
        font-size: 10px;
        color: var(--muted);
        text-transform: uppercase;
    }

    .iris-bg { background: rgba(196, 167, 231, 0.1); color: var(--iris); }
    .foam-bg { background: rgba(156, 207, 216, 0.1); color: var(--foam); }
</style>