<template>
  <nav
    class="sidebar"
    :class="{ collapsed: showIconsOnly, 'sidebar--bar': isBar }"
    aria-label="Main navigation"
  >
    <div class="sidebar-card">
      <el-menu v-if="!showIconsOnly" :default-active="activeMenu" class="nav-menu" :router="true">
        <template v-for="item in menuItems" :key="item.index">
          <el-menu-item v-if="!item.children" :index="item.index" :route="item.route">
            <el-icon><component :is="item.icon" /></el-icon>
            <span>{{ item.title }}</span>
          </el-menu-item>

          <el-sub-menu v-else :index="item.index">
            <template #title>
              <el-icon><component :is="item.icon" /></el-icon>
              <span>{{ item.title }}</span>
            </template>
            <el-menu-item
              v-for="child in item.children"
              :key="child.index"
              :index="child.index"
              :route="child.route"
            >
              {{ child.title }}
            </el-menu-item>
          </el-sub-menu>
        </template>
      </el-menu>

      <div v-else class="nav-menu collapsed-menu">
        <template v-for="item in menuItems" :key="item.index">
          <el-tooltip
            v-if="!item.children && item.route"
            :content="item.title"
            :placement="isBar ? 'bottom' : 'right'"
          >
            <button
              type="button"
              class="menu-item"
              :class="{ active: isMenuActiveItem(item) }"
              :aria-label="item.title"
              @click="navigateToRoute(item.route)"
            >
              <el-icon><component :is="item.icon" /></el-icon>
            </button>
          </el-tooltip>

          <el-popover
            v-else
            :placement="isBar ? 'bottom' : 'right-start'"
            :width="180"
            trigger="hover"
            :offset="10"
            popper-class="submenu-popover"
          >
            <template #reference>
              <button
                type="button"
                class="menu-item"
                :class="{ active: isMenuActiveItem(item) }"
                :aria-label="item.title"
              >
                <el-icon><component :is="item.icon" /></el-icon>
              </button>
            </template>
            <div class="popover-menu">
              <div
                v-for="child in item.children"
                :key="child.index"
                class="popover-menu-item"
                :class="{ active: activeMenu === child.index }"
                @click="navigateToRoute(child.route)"
              >
                {{ child.title }}
              </div>
            </div>
          </el-popover>
        </template>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { createRouteToIndexMap, isMenuActive, menuItems, type MenuItem } from './menuConfig'

interface Props {
  isCollapse: boolean
  /** Phone layout: the navigation sits in a bar above the page instead of beside it. */
  isBar?: boolean
}

const props = withDefaults(defineProps<Props>(), { isBar: false })

const router = useRouter()
const route = useRoute()

const routeToIndexMap = createRouteToIndexMap()

const activeMenu = computed(() => {
  return routeToIndexMap[route.path] || '0'
})

const isMenuActiveItem = (item: MenuItem): boolean => {
  return isMenuActive(item, activeMenu.value)
}

const showIconsOnly = computed(() => props.isBar || props.isCollapse)

const navigateToRoute = (routePath: string) => {
  router.push(routePath)
}
</script>

<style scoped>
.sidebar {
  flex: 0 0 auto;
  width: 228px;
  padding: var(--shell-gutter) 0 var(--shell-gutter) var(--shell-gutter);
  white-space: nowrap;
}

.sidebar.collapsed {
  width: calc(76px + var(--shell-gutter));
}

.sidebar-card {
  position: sticky;
  top: var(--shell-gutter);
  height: 100%;
  max-height: calc(100vh - var(--app-header-height) - var(--shell-gutter) * 2);
  overflow: hidden;
  padding: 12px 0;
  background: var(--surface-glass);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-soft);
}

.nav-menu {
  border: none;
  background: transparent;
  padding: 0 12px;
}

.nav-menu :deep(.el-menu-item),
.nav-menu :deep(.el-sub-menu__title),
.nav-menu :deep(.el-sub-menu .el-menu-item) {
  height: 44px;
  line-height: 44px;
  margin: 4px 0;
  padding: 0 16px !important;
  border-radius: var(--radius-pill);
  transition:
    background-color 0.2s ease,
    color 0.2s ease;
  color: var(--text-strong);
  font-size: 14px;
}

.nav-menu :deep(.el-sub-menu .el-menu) {
  background: transparent !important;
  box-shadow: none !important;
  border: none !important;
  padding: 0 !important;
  margin: 0 !important;
}

.nav-menu :deep(.el-sub-menu .el-menu-item) {
  color: #666;
  padding-left: 48px !important;
  font-size: 14px;
}

.nav-menu :deep(.el-menu-item:hover),
.nav-menu :deep(.el-sub-menu__title:hover),
.nav-menu :deep(.el-sub-menu .el-menu-item:hover),
.nav-menu :deep(.el-menu-item.is-active),
.nav-menu :deep(.el-sub-menu .el-menu-item.is-active),
.nav-menu :deep(.el-sub-menu.is-active > .el-sub-menu__title) {
  background: rgba(56, 112, 168, 0.1) !important;
  color: #3870a8 !important;
}

.nav-menu :deep(.el-menu-item.is-active),
.nav-menu :deep(.el-sub-menu .el-menu-item.is-active) {
  background: #ffd04b !important;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(255, 208, 75, 0.3);
}

.nav-menu :deep(.el-menu-item i),
.nav-menu :deep(.el-sub-menu__title i) {
  margin-right: 12px;
  font-size: 18px;
}

.nav-menu :deep(.el-sub-menu),
.nav-menu :deep(.el-sub-menu .el-menu) {
  transition: none !important;
}

.collapsed-menu {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
}

.collapsed-menu .menu-item {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border: 0;
  border-radius: var(--radius-pill);
  background: transparent;
  cursor: pointer;
  transition:
    background-color 0.2s ease,
    color 0.2s ease;
  color: var(--text-strong);
}

.collapsed-menu .menu-item:hover {
  background: rgba(56, 112, 168, 0.1);
  color: #3870a8;
}

.collapsed-menu .menu-item.active {
  background: #ffd04b !important;
  color: #3870a8 !important;
  box-shadow: 0 4px 12px rgba(255, 208, 75, 0.3);
}

.collapsed-menu .menu-item .el-icon {
  font-size: 20px;
}

/* Phone: a single row of destinations above the page. */
.sidebar--bar,
.sidebar--bar.collapsed {
  width: 100%;
  padding: var(--shell-gutter) var(--shell-gutter) 0;
}

.sidebar--bar .sidebar-card {
  position: static;
  max-height: none;
  padding: 6px;
}

.sidebar--bar .nav-menu {
  display: flex;
  gap: 6px;
  padding: 0;
}

.sidebar--bar .nav-menu :deep(.el-menu-item) {
  flex: 1;
  justify-content: center;
  margin: 0;
  height: 44px;
  line-height: 44px;
}

.sidebar--bar .nav-menu :deep(.el-menu-item i) {
  margin-right: 8px;
}

.sidebar--bar .collapsed-menu {
  flex-direction: row;
  justify-content: space-around;
  padding: 0;
}

.popover-menu {
  padding: 8px 0;
}

.popover-menu-item {
  padding: 12px 20px;
  margin: 6px 10px;
  border-radius: var(--radius-pill);
  cursor: pointer;
  transition: all 0.2s ease;
  color: #666;
  font-size: 15px;
}

.popover-menu-item:hover {
  background: rgba(56, 112, 168, 0.1);
  color: #3870a8;
}

.popover-menu-item.active {
  background: #ffd04b !important;
  color: #3870a8 !important;
  font-weight: bold;
}
</style>

<style>
.submenu-popover {
  padding: 0 !important;
  background: rgba(255, 255, 255, 0.8) !important;
  backdrop-filter: blur(10px) !important;
  border-radius: 24px !important;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
}

.submenu-popover .el-popper__arrow {
  display: none;
}
</style>
