<template>
  <div class="main-layout">
    <div class="container">
      <AppHeader :is-collapse="isCollapse" @toggle-collapse="toggleCollapse" />

      <div class="body-container">
        <AppSidebar :is-collapse="isCollapse" />

        <div
          ref="mainContentRef"
          class="main-content"
          :class="[
            `main-content--${contentLayout}`,
            { 'main-content--locked': isGradingRoute && contentLayout === 'wide' },
          ]"
        >
          <router-view></router-view>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getContentLayout, type ContentLayout } from '@/utils/responsive'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from './AppHeader.vue'
import AppSidebar from './AppSidebar.vue'

const isCollapse = ref(false)
const contentLayout = ref<ContentLayout>('wide')
const mainContentRef = ref<HTMLElement>()
const route = useRoute()
let contentResizeObserver: ResizeObserver | undefined

const isGradingRoute = computed(() => route.path.startsWith('/grading'))

const toggleCollapse = () => {
  isCollapse.value = !isCollapse.value
}

onMounted(() => {
  const content = mainContentRef.value
  if (!content) return

  const updateLayout = () => {
    contentLayout.value = getContentLayout(content.getBoundingClientRect().width)
  }

  updateLayout()
  contentResizeObserver = new ResizeObserver(updateLayout)
  contentResizeObserver.observe(content)
})

onUnmounted(() => contentResizeObserver?.disconnect())
</script>

<style scoped>
.main-layout {
  --app-header-height: 70px;
  --main-content-padding: 20px;
  min-height: 100vh;
}

.container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.body-container {
  flex: 1 0 auto;
  display: flex;
  min-height: 0;
}

.main-content {
  flex: 1;
  min-width: 0;
  background: transparent;

  padding: 0;
  overflow: visible;
}

.main-content--locked {
  overflow: hidden;
}

:deep(.hover) {
  transition: all 0.3s ease;
}

:deep(.hover:hover) {
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  transform: translateY(-2px) scale(1.005);
}
</style>
