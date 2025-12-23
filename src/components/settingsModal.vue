<script setup lang="ts">
import { useUiStore } from '../stores/ui';

const uiStore = useUiStore();
</script>

<template>
    <div v-if="uiStore.isSettingsOpen" class="modal show">
        <div class="modal-content">
            <div class="modal-header">
                <h2>Settings</h2>
                <button class="close-modal" @click="uiStore.isSettingsOpen = false">×</button>
            </div>

            <div class="modal-body">
                <label>Dirs for Scan (Non-Steam):</label>

                <div id="settings-path-list">
                    <div class="muted-text" v-if="uiStore.settings.non_steam_paths.length === 0">
                        Dirs not add
                    </div>

                    <div
                        class="path-item"
                        v-for="path in uiStore.settings.non_steam_paths"
                        :key="path">
                        <span :title="path" style="overflow: hidden; text-overflow: ellipsis;">
                            {{ path }}
                        </span>
                        <button class="simple-icon-btn" @click="uiStore.removeScanPath(path)">
                            <span class="material-symbols-rounded">delete</span>
                        </button>
                    </div>
                </div>

                <button class="primary-btn" @click="uiStore.addScanPath()">
                    Add Folder
                </button>
            </div>
        </div>
    </div>
</template>

<style scoped>
    .modal.show {
        display: flex !important;
        z-index: 9999;
    }

    .modal-content {
        background: var(--surface);
        width: 500px;
        max-width: 90vw;
        border-radius: 12px;
        border: 1px solid var(--highlight-high);
        padding: 25px;
        box-shadow: 0 20px 50px rgba(0,0,0,0.5);
        display: flex;
        flex-direction: column;
        animation: fadeIn 0.3s ease;
    }

    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
    }

    .modal-header h2 {
        font-size: 18px;
        color: var(--text);
        font-weight: 600;
    }

    .close-modal {
        background: transparent;
        border: none;
        color: var(--muted);
        font-size: 24px;
        cursor: pointer;
        line-height: 1;
        padding: 0;
        transition: color 0.2s;
    }

    .close-modal:hover {
        color: var(--love);
    }

    .modal-body {
        display: flex;
        flex-direction: column;
        gap: 15px;
    }

    .modal-body label {
        font-size: 12px;
        color: var(--subtle);
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    #settings-path-list {
        max-height: 300px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding-right: 5px;
    }

    .path-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 14px;
        background: var(--overlay);
        border-radius: 8px;
        border: 1px solid var(--highlight-high);
        font-size: 13px;
        color: var(--text);
    }

    .path-item span {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        margin-right: 10px;
    }

    .muted-text {
        color: var(--muted);
        font-style: italic;
        text-align: center;
        padding: 20px;
        border: 1px dashed var(--highlight-high);
        border-radius: 8px;
    }

    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }

    #settings-path-list::-webkit-scrollbar { width: 4px; }
    #settings-path-list::-webkit-scrollbar-thumb { background: var(--highlight-high); border-radius: 2px; }
    #settings-path-list::-webkit-scrollbar-thumb:hover { background: var(--iris); }
</style>