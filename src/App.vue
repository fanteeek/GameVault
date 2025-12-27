<template>
  <div class="app-wrapper">
    <WindowResizers />
    <Titlebar />

    <div id="app-container">
      <div class="sidebar-wrapper" :style="{ flexBasis: sidebarWidth + 'px'}">
        <Sidebar />
      </div>

      <div 
        id="sidebar-resizer" 
        @mousedown="startSidebarResize"
        :class="{ 'active': isResizingSidebar }">
      </div>

      <main id="main-content">
        <Dashboard v-if="uiStore.currentView === 'dashboard'" />
        <GameView v-else-if="uiStore.currentView === 'game'" />
      </main>
    </div>
    <Statusbar />
    <!-- Modals -->
    <SettingsModal />
    <HistoryModal />
  </div>
</template>

<script setup lang="ts">
  import { onMounted, ref } from 'vue';
  import { useGamesStore } from './stores/games';
  import { useUiStore } from './stores/ui';
  import Titlebar from './components/titlebar.vue';
  import Sidebar from './components/sidebar.vue';
  import GameView from './components/gameView.vue';
  import SettingsModal from './components/settingsModal.vue';
  import HistoryModal from './components/historyModal.vue';
  import Dashboard from './components/dashboard.vue';
  import WindowResizers from './components/windowResizers.vue';
  import Statusbar from './components/statusbar.vue';

  const gamesStore = useGamesStore();
  const uiStore = useUiStore();

  const sidebarWidth = ref(260);
  const isResizingSidebar = ref(false);

  const startSidebarResize = (e: MouseEvent) => {
    e.preventDefault();
    isResizingSidebar.value = true;
    document.body.style.cursor = 'e-resize';

    const onMouseMove = (me: MouseEvent) => {
      let newWidth = me.clientX;
      if (newWidth < 200) newWidth = 200;
      if (newWidth > 500) newWidth = 500;
      sidebarWidth.value = newWidth;
    }

    const onMouseUp = () => {
      isResizingSidebar.value = false;
      document.body.style.cursor = ''
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      localStorage.setItem('sidebar-width', String(sidebarWidth.value));
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  // Init
  const initApp = async () => {
    console.log("Init App..");

    const savedWidth = localStorage.getItem('sidebar-width');
    if (savedWidth) sidebarWidth.value = parseInt(savedWidth);

    await uiStore.initWindowControls();
    await uiStore.loadSettings();
    await gamesStore.loadLibrary();
    await gamesStore.loadDashboard();

    await uiStore.checkUpdates();
    await uiStore.getAppVersion();
  };

  onMounted(async () => {
    window.UI = {
      updateListIcon: (gameId: string, iconData: string) => {
        const game = gamesStore.allGames.find(g => String(g.id) === String(gameId));
        if (game) game.local_icon = iconData;
      },

      togglePlayButton: (isRunning: boolean) => {
        gamesStore.isGameRunning = isRunning;
      },

      updateDownloadProgress: (percent: number) => {
        uiStore.updateProgress = percent;
        uiStore.updateStatusText = `Downloading: ${percent}`;
      },

      resetUpdateUI: (errorMessage: string) => {
        uiStore.isUpdating = false;
        uiStore.updateProgress = 0;
        uiStore.updateStatusText = errorMessage;
      },

      updateUIProgress: (percent: number) => {
        uiStore.setBackupProgress(percent);
      },

      updateGameAsset: (gameId: string, type: 'hero' | 'logo', data: string) => {
        if (gamesStore.activeGameId === gameId) {
            uiStore.updateAssetFromEvent(type, data);
        }
      },

      onBackupComplete: async (resultPath: string) => {
        console.log("Backup ready: ", resultPath)

        setTimeout(() => {
          uiStore.finishBackup();
        }, 1000);

        if (gamesStore.activeGameId) {
          await gamesStore.selectGame(gamesStore.activeGameId);
        }
      }
    };

    if (window.pywebview) initApp();
    else window.addEventListener('pywebviewready', () => initApp());
  });
</script>

<style scoped>
  .app-wrapper {
    display: flex;
    flex-direction: column;
    height: 100vh;
    width: 100vw;
    overflow: hidden;
  }

  #app-container {
    display: flex;
    flex-grow: 1;
    overflow: hidden;
    position: relative; 
  }

  .sidebar-wrapper {
    flex-shrink: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    height: 100%;
    position: relative;
  }

  #sidebar-resizer {
    width: 5px;
    cursor: col-resize;
    background: transparent;
    transition: background 0.2s;
    z-index: 100;
    height: 100%;
    margin-left: -2px; 
    margin-right: -2px;
    position: relative;
  }

  #sidebar-resizer:hover, #sidebar-resizer.active {
    background: var(--iris);
  }

  #main-content {
    flex-grow: 1;
    background: var(--base);
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
</style>