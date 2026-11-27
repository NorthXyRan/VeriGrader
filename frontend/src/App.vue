<template>
  <el-config-provider size="small" :z-index="3000">
    <div id="app">
      <router-view />
      <MessageContainer />
    </div>
  </el-config-provider>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { MessageContainer } from './components/Message'
import { isPagesDemo } from './config/deployment'
import { loadDemo } from './demo/loadDemo'
import { useExamDataStore } from './stores/useExamDataStore'
import { useUploadStatusStore } from './stores/useUploadStatusStore'

const examDataStore = useExamDataStore()
const uploadStatusStore = useUploadStatusStore()

onMounted(() => {
  examDataStore.loadFromLocal()
  uploadStatusStore.loadFromLocal()
  if (isPagesDemo && !examDataStore.isDataComplete) loadDemo()
})
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
