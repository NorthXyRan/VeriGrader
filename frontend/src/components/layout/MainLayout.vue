<template>
  <div class="main-layout" :class="{ 'main-layout--phone': isPhone }">
    <AppHeader
      :is-collapse="isCollapse"
      :show-collapse-toggle="!isPhone"
      @toggle-collapse="toggleCollapse"
    />

    <div class="body-container">
      <AppSidebar :is-collapse="isCollapse" :is-bar="isPhone" />

      <main ref="mainContentRef" class="main-content" :class="`main-content--${contentLayout}`">
        <router-view></router-view>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getContentLayout, VIEWPORT_BREAKPOINTS, type ContentLayout } from '@/utils/responsive'
import { contentLayoutKey } from '@/composables/useContentLayout'
import { onMounted, onUnmounted, provide, readonly, ref } from 'vue'
import AppHeader from './AppHeader.vue'
import AppSidebar from './AppSidebar.vue'

const isCollapse = ref(false)
const isPhone = ref(false)
const contentLayout = ref<ContentLayout>('wide')
provide(contentLayoutKey, readonly(contentLayout))
const mainContentRef = ref<HTMLElement>()
let contentResizeObserver: ResizeObserver | undefined
const mediaCleanups: Array<() => void> = []

const toggleCollapse = () => {
  isCollapse.value = !isCollapse.value
}

const watchMedia = (query: string, onChange: (matches: boolean) => void) => {
  if (typeof window.matchMedia !== 'function') return
  const media = window.matchMedia(query)
  const listener = (event: MediaQueryListEvent) => onChange(event.matches)
  onChange(media.matches)
  media.addEventListener('change', listener)
  mediaCleanups.push(() => media.removeEventListener('change', listener))
}

onMounted(() => {
  // Phones get a navigation bar; mid-size screens start with the sidebar folded to icons so the
  // grading workspace keeps its width. The header toggle still overrides this until the next
  // breakpoint is crossed.
  watchMedia(`(max-width: ${VIEWPORT_BREAKPOINTS.phone}px)`, (matches) => {
    isPhone.value = matches
  })
  watchMedia(`(max-width: ${VIEWPORT_BREAKPOINTS.desktop - 1}px)`, (matches) => {
    isCollapse.value = matches
  })

  const content = mainContentRef.value
  if (!content) return

  const updateLayout = () => {
    contentLayout.value = getContentLayout(content.getBoundingClientRect().width)
  }

  updateLayout()
  contentResizeObserver = new ResizeObserver(updateLayout)
  contentResizeObserver.observe(content)
})

onUnmounted(() => {
  contentResizeObserver?.disconnect()
  mediaCleanups.forEach((cleanup) => cleanup())
})
</script>

<style scoped>
.main-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.body-container {
  flex: 1 0 auto;
  display: flex;
  min-height: 0;
}

.main-layout--phone .body-container {
  flex-direction: column;
}

.main-content {
  flex: 1;
  min-width: 0;
  background: transparent;
  padding: 0;
  overflow: visible;
}

@media (hover: hover) {
  :deep(.hover) {
    transition:
      box-shadow 0.25s ease,
      transform 0.25s ease;
  }

  :deep(.hover:hover) {
    box-shadow: var(--shadow-lifted);
    transform: translateY(-2px);
  }
}
</style>
