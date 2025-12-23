<script setup lang="ts">
    import { useUiStore } from '../stores/ui';
    const uiStore = useUiStore();
</script>

<template>
    <div id="titlebar" class="pywebview-drag-region">
        <div style="display: flex; gap: 16px; align-items: center; margin-left: 10px;">
            <div class="title">GameVault</div>
            <div class="nav-section">
                <button id="nav-home" class="nav-btn"
                :class="{ active: uiStore.currentView === 'dashboard' }"
                @click="uiStore.showDashboard()">
                <span class="material-symbols-rounded">home</span> Главная
                </button>
            </div>
        </div>

        <div id="window-controls">
            <button @click="uiStore.minimize()">
                <span class="material-symbols-rounded">remove</span>
            </button>

            <button @click="uiStore.toggleMaximize()">
                <span class="material-symbols-rounded">
                    {{ uiStore.isMaximized ? 'filter_none' : 'crop_square' }}
                </span>
            </button>

            <button @click="uiStore.closeApp()" class="close-btn">
                <span class="material-symbols-rounded">close</span>
            </button>
        </div>
    </div>
</template>

<style scoped>
    #titlebar {
        height: 38px;
        background: var(--base);
        display: flex;
        justify-content: space-between;
        align-items: center;
        user-select: none;
        -webkit-app-region: drag;
        flex-shrink: 0;
        padding-left: 6px;
        border-bottom: 1px solid var(--highlight-high);
    }

    .title {
        font-size: 10px;
        color: var(--muted);
        margin-right: 0px;
        letter-spacing: 0.5px;
    }

    .nav-section {
        display: flex;
        gap: 5px;
        -webkit-app-region: no-drag;
    }

    .nav-btn {
        background: transparent;
        border: none;
        color: var(--subtle);
        padding: 4px 12px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 12px;
        display: flex;
        align-items: center;
        gap: 6px;
        transition: all 0.2s;
    }

    .nav-btn:hover {
        background: var(--overlay);
        color: var(--text);
    }

    .nav-btn.active {
        background: var(--surface);
        color: var(--iris);
    }

    #window-controls {
        display: flex;
        height: 100%;
        -webkit-app-region: no-drag;
    }

    #window-controls button {
        background: transparent;
        border: none;
        color: var(--text);
        width: 46px;
        height: 100%;
        cursor: pointer;
        display: flex;
        justify-content: center;
        align-items: center;
        transition: background 0.2s;
    }

    #window-controls button:hover {
        background: var(--overlay);
    }

    .close-btn:hover {
        background: var(--love) !important;
        color: var(--base);
    }

    .material-symbols-rounded {
        font-size: 18px;
    }
</style>