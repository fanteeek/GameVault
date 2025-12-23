<script setup lang="ts">
import api from '../api';

const startResize = (e: MouseEvent, direction: string) => {
  e.preventDefault();
  
  const startX = e.clientX;
  const startY = e.clientY;
  const startWidth = window.innerWidth;
  const startHeight = window.innerHeight;

  const onMouseMove = (me: MouseEvent) => {
    let newW = startWidth;
    let newH = startHeight;

    if (direction.includes('r')) {
        newW = startWidth + (me.clientX - startX);
    }
    if (direction.includes('b')) {
        newH = startHeight + (me.clientY - startY);
    }

    api.resizeWindow(Math.max(newW, 800), Math.max(newH, 600));
  };

  const onMouseUp = () => {
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  };

  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
};
</script>

<template>
  <div>
    <div class="resizer" id="resizer-r" @mousedown="startResize($event, 'r')"></div>
    <div class="resizer" id="resizer-b" @mousedown="startResize($event, 'b')"></div>
    <div class="resizer-corner" id="resizer-rb" @mousedown="startResize($event, 'rb')"></div>
  </div>
</template>

<style scoped>
.resizer {
    position: fixed;
    z-index: 10000;
    background: transparent;
}

#resizer-r { top: 0; right: 0; width: 6px; height: 100%; cursor: e-resize; }
#resizer-b { bottom: 0; left: 0; width: 100%; height: 6px; cursor: s-resize; }

.resizer-corner {
    position: fixed;
    width: 15px;
    height: 15px;
    z-index: 10001;
    bottom: 0; 
    right: 0; 
    cursor: se-resize;
    background: transparent;
}
</style>