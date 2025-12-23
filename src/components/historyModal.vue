<script setup lang="ts">
import { useUiStore } from '../stores/ui';
import { useGamesStore } from '../stores/games';
import api from '../api';

const uiStore = useUiStore();
const gamesStore = useGamesStore();

const openBackupFolder = async () => {
    if (gamesStore.activeGame?.name) {
        await api.openBackupFolder(gamesStore.activeGame.name);
    }
};
</script>

<template>
  <div v-if="uiStore.isHistoryOpen" class="modal show">
    <div class="modal-content">
      <div class="modal-header">
        <h2>History Backups</h2>
        <button @click="uiStore.isHistoryOpen = false" class="close-modal">
          <span class="material-symbols-rounded">close</span>
        </button>
      </div>
      
      <div class="modal-body">
        <div id="history-list">
          <div v-if="gamesStore.activeGameBackups.length === 0" class="muted-text">
            No Backups.
          </div>
          <div 
            v-for="backup in gamesStore.activeGameBackups" 
            :key="backup.path" 
            class="history-item"
          >
            <div class="history-info">
                <span class="history-name">{{ backup.name }}</span>
                <span class="history-meta">
                    {{ backup.size }} • {{ new Date(backup.date * 1000).toLocaleDateString() }}
                </span>
            </div>
            <button class="simple-icon-btn" @click="gamesStore.deleteBackup(backup.path)">
                <span class="material-symbols-rounded">delete</span>
            </button>
          </div>
        </div>

        <div style="margin-top: 14px; display: flex; gap: 10px;">
          <button class="primary-btn" @click="openBackupFolder()">
              <span class="material-symbols-rounded">folder_open</span> Open Folder
          </button>
        </div>
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
      width: 450px;
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
      margin-bottom: 15px;
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
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
  }

  .close-modal:hover {
      background: var(--overlay);
      color: var(--text);
  }

  #history-list {
      margin: 10px 0 20px 0;
      overflow-y: auto;
      max-height: 350px;
      padding-right: 5px;
      display: flex;
      flex-direction: column;
      gap: 2px;
  }

  .history-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 12px;
      background: transparent;
      border-radius: 8px;
      transition: background 0.2s;
      border-bottom: 1px solid var(--overlay);
  }

  .history-item:last-child {
      border-bottom: none;
  }

  .history-item:hover {
      background: var(--overlay);
  }

  .history-info {
      display: flex;
      flex-direction: column;
      gap: 3px;
  }

  .history-name {
      font-size: 13px;
      color: var(--text);
      font-weight: 500;
  }

  .history-meta {
      font-size: 11px;
      color: var(--subtle);
  }

  /* Текст "Пусто" */
  .muted-text {
      text-align: center;
      color: var(--muted);
      padding: 30px;
      font-size: 13px;
  }

  @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
  }

  #history-list::-webkit-scrollbar { width: 4px; }
  #history-list::-webkit-scrollbar-thumb { background: var(--highlight-high); border-radius: 2px; }
  #history-list::-webkit-scrollbar-thumb:hover { background: var(--iris); }
</style>
