<script setup lang="ts">
    import { useUiStore } from '../stores/ui';
    const uiStore = useUiStore();
</script>

<template>
    <footer id="status-bar">
        <div class="footer-left">
            <span class="status-dot" :class="{ 'active': uiStore.updateInfo?.update_available, 'error': uiStore.updateHasError }"></span>
            <span id="status-text">{{ uiStore.updateStatusText }}</span>
            
            <button v-if="uiStore.updateInfo?.update_available && !uiStore.isUpdating" class="update-btn" @click="uiStore.startUpdate">Update Now</button>

            <div id="update-progress-container" v-if="uiStore.updateProgress > 0">
                <div class="progress-track">
                    <div id="update-progress-fill" :style="{ width: uiStore.updateProgress + '%' }"></div>
                </div>
            </div>
        </div>

        <div class="footer-right">
            <a href="https://github.com/fanteeek/GameVault" class="footer-link">GitHub</a>
            <span class="version-tag">v<span id="app-version">{{ uiStore.appVersion || '0.0.0'}}</span></span>
        </div>
    </footer>
</template>

<style scoped>
    #status-bar {
        height: 24px;
        flex-shrink: 0;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0 15px;
        font-size: 10px;
        color: var(--muted);
        background: var(--base);
        user-select: none;
    }

    #update-progress-container {
        display: block;
        margin-left: 15px;
        width: 100px;
    }

    #update-progress-fill {
        width: 0%;
        height: 100%;
        background: var(--iris);
        transition: width 0.2s;
    }

    .progress-track {
        width: 100px;
        height: 4px;
        background: var(--overlay);
        border-radius: 10px;
        overflow: hidden;
    }

    .footer-left, .footer-right {
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .footer-link {
        color: var(--muted);
        text-decoration: none;
        transition: color 0.2s;
    }

    .footer-link:hover {
        color: var(--iris);
    }

    .status-dot {
        width: 6px;
        height: 6px;
        background: var(--foam);
        border-radius: 50%;
        box-shadow: 0 0 5px var(--foam);
    }

    .status-dot.active {
        background: var(--iris);
        box-shadow: 0 0 8px var(--iris);
    }

    .status-dot.error {
        background: var(--love);
        box-shadow: 0 0 8px var(--love);
    }

    .version-tag {
        background: var(--overlay);
        padding: 2px 6px;
        border-radius: 4px;
        color: var(--subtle);
    }
    
    .update-btn {
        background: var(--iris);
        color: var(--base);
        border: none;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 9px;
        font-weight: bold;
        cursor: pointer;
        margin-left: 5px;
        transition: opacity 0.2s;
    }

    .update-btn:hover {
        opacity: 0.8;
    }
</style>