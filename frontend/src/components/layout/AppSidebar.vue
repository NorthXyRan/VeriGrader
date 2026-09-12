<template>
  <div class="sidebar" :class="{ collapsed: isCollapse }">
    <div class="sidebar-card hover">
      <el-menu v-if="!isCollapse" :default-active="activeMenu" class="nav-menu" :router="true">
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
          <el-tooltip v-if="!item.children && item.route" :content="item.title" placement="right">
            <div
              class="menu-item"
              :class="{ active: isMenuActiveItem(item) }"
              @click="navigateToRoute(item.route)"
            >
              <el-icon><component :is="item.icon" /></el-icon>
            </div>
          </el-tooltip>

          <el-popover
            v-else
            placement="right-start"
            :width="180"
            trigger="hover"
            :offset="10"
            popper-class="submenu-popover"
          >
            <template #reference>
              <div class="menu-item" :class="{ active: isMenuActiveItem(item) }">
                <el-icon><component :is="item.icon" /></el-icon>
              </div>
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
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { createRouteToIndexMap, isMenuActive, menuItems, type MenuItem } from './menuConfig'

interface Props {
  isCollapse: boolean
}

defineProps<Props>()

const router = useRouter()
const route = useRoute()

const routeToIndexMap = createRouteToIndexMap()

const activeMenu = computed(() => {
  return routeToIndexMap[route.path] || '0'
})

const isMenuActiveItem = (item: MenuItem): boolean => {
  return isMenuActive(item, activeMenu.value)
}

const navigateToRoute = (routePath: string) => {
  router.push(routePath)
}
</script>

<style scoped>
.sidebar {
  width: 300px;
  padding: 20px 15px;
  transition: width 0.3s ease;
}

.sidebar.collapsed {
  width: 100px;
}

.sidebar-card {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border-radius: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.2);
  height: 100%;
  overflow: hidden;
  padding: 20px 0;
}

.nav-menu {
  border: none;
  background: transparent;
  padding: 0 20px;
}

.nav-menu :deep(.el-menu-item),
.nav-menu :deep(.el-sub-menu__title),
.nav-menu :deep(.el-sub-menu .el-menu-item) {
  height: 50px;
  line-height: 50px;
  margin: 8px 0;
  border-radius: 24px;
  transition:
    background-color 0.2s ease,
    color 0.2s ease;
  color: #333;
  font-size: 16px;
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
  padding-left: 50px !important;
  font-size: 15px;
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
  margin-right: 16px;
  font-size: 20px;
}

.nav-menu :deep(.el-sub-menu),
.nav-menu :deep(.el-sub-menu .el-menu) {
  transition: none !important;
}

.collapsed-menu {
  padding: 0 10px;
}

.collapsed-menu .menu-item {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  margin: 10px 0;
  border-radius: 24px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #333;
}

.collapsed-menu .menu-item:hover {
  background: rgba(56, 112, 168, 0.1);
  color: #3870a8;
  transform: scale(1.05);
}

.collapsed-menu .menu-item.active {
  background: #ffd04b !important;
  color: #3870a8 !important;
  font-weight: bold;
  box-shadow: 0 4px 12px rgba(255, 208, 75, 0.3);
}

.collapsed-menu .menu-item .el-icon {
  font-size: 22px;
}

.popover-menu {
  padding: 8px 0;
}

.popover-menu-item {
  padding: 12px 20px;
  margin: 6px 10px;
  border-radius: 24px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #666;
  font-size: 16px;
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
