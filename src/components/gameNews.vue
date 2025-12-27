<template>
  <div class="news-section" v-if="newsList.length > 0">
    <h3 class="section-title">Latest Updates</h3>
    
    <div class="news-grid">
      <div v-for="(news, index) in newsList" :key="index" class="news-card">
        
        <div v-if="news.image" class="news-image-wrapper">
            <img :src="news.image" alt="News Image" loading="lazy">
        </div>

        <div class="news-content-wrapper">
            <div class="news-header">
                <span class="news-date">{{ news.date }}</span>
                <span class="news-author">{{ news.author }}</span>
            </div>
            
            <h4 class="news-title">{{ news.title }}</h4>
            <p class="news-preview">{{ news.contents }}</p>
            
            <a :href="news.url" target="_blank" class="read-more-btn">
                Read on Steam <span class="material-symbols-rounded">open_in_new</span>
            </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useGamesStore } from '../stores/games';

const gamesStore = useGamesStore();
const newsList = computed(() => gamesStore.activeGameNews);
</script>

<style scoped>
.news-section {
    margin: 30px 40px;
    animation: fadeIn 0.5s ease;
}

.section-title {
    font-size: 14px;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 15px;
    border-bottom: 1px solid var(--highlight-high);
    padding-bottom: 5px;
}

.news-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
}

.news-card {
    background: var(--surface);
    border: 1px solid var(--highlight-high);
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    transition: transform 0.2s, border-color 0.2s;
    padding: 0;
}

.news-image-wrapper {
    width: 100%;
    height: 140px;
    background: var(--base);
    border-bottom: 1px solid var(--highlight-high);
}

.news-image-wrapper img {
    width: 100%;
    height: 100%;
    object-fit: cover; 
}

.news-content-wrapper {
    padding: 20px;
    display: flex;
    flex-direction: column;
    flex-grow: 1;
}

.news-card:hover {
    transform: translateY(-3px);
    border-color: var(--iris);
}

.news-header {
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    color: var(--subtle);
    margin-bottom: 10px;
}

.news-title {
    font-size: 16px;
    color: var(--text);
    margin-bottom: 10px;
    line-height: 1.4;
}

.news-preview {
    font-size: 13px;
    color: var(--muted);
    line-height: 1.5;
    flex-grow: 1;
    margin-bottom: 15px;
}

.read-more-btn {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 12px;
    color: var(--iris);
    text-decoration: none;
    font-weight: 600;
    align-self: flex-start;
}

.read-more-btn span {
    font-size: 14px;
}

.read-more-btn:hover {
    color: var(--foam);
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}
</style>