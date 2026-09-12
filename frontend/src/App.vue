<template>
  <el-config-provider size="small" :z-index="3000">
    <div id="app">
      <router-view />
      <MessageContainer />
    </div>
  </el-config-provider>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { MessageContainer } from './components/Message'
import { useExamDataStore } from './stores/useExamDataStore'
import { useUploadStatusStore } from './stores/useUploadStatusStore'
import { initResponsive } from './utils/responsive'

const examDataStore = useExamDataStore()
const uploadStatusStore = useUploadStatusStore()

let cleanupResponsive: (() => void) | undefined

onMounted(() => {
  cleanupResponsive = initResponsive()
  examDataStore.loadFromLocal()
  uploadStatusStore.loadFromLocal()
})

onUnmounted(() => cleanupResponsive?.())
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

#app {
  width: 100%;
  min-height: 100%;
}
</style>
