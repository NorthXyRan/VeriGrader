<template>
  <div class="header-container">
    <div class="header-card">
      <span>Human-AI Collaborative Intelligent Grading with Visual Interaction</span>
      <div class="header-controls">
        
        <!-- 新增：加载自动批改按钮 -->
        <button
          class="control-button"
          @click="loadAutoGraded"
        >
          Load Auto-Grading
        </button>

        <!-- 主题选择器 -->
        <div class="theme-dropdown" ref="dropdownRef">
          <button
            class="control-button"
            @click="toggleDropdown"
            :class="{ 'dropdown-open': isDropdownOpen }"
          >
            <Brush class="icon" />
            Theme
          </button>

          <!-- 下拉菜单 -->
          <div v-show="isDropdownOpen" class="dropdown-menu">
            <button
              v-for="theme in themeOptions"
              :key="theme"
              class="dropdown-item"
              :class="{ active: selectedTheme === theme }"
              @click="changeTheme(theme)"
            >
              {{ theme }}
              <span v-if="selectedTheme === theme" class="check-mark">✓</span>
            </button>
          </div>
        </div>

        <!-- 折叠按钮 -->
        <button class="control-button" @click="$emit('toggleCollapse')">
          <component :is="isCollapse ? Expand : Fold" class="icon" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'      // 新增
import { Brush, Expand, Fold } from '@element-plus/icons-vue'
import { useExamDataStore } from '../../stores/useExamDataStore'
import { ElMessage } from 'element-plus'

// 接收参数
interface Props {
  isCollapse: boolean
}
defineProps<Props>()

// 事件发送
defineEmits<{
  toggleCollapse: []
}>()

// 配置
const themeOptions = ['default', 'nature', 'vibrant']
const themeBackgrounds: Record<string, string> = {
  default: '/src/assets/background_image/BlueLandscapeLight.png',
  nature: '/src/assets/background_image/MojaveDesert.png',
  vibrant: '/src/assets/background_image/BigSur.png'
}

// 状态
const selectedTheme = ref<string>('default')
const isDropdownOpen = ref(false)
const dropdownRef = ref<HTMLElement>()

// router
const router = useRouter()       // 新增
const examStore = useExamDataStore()

// 应用背景
const applyBackground = (background: string) => {
  Object.assign(document.documentElement.style, {
    backgroundImage: `url(${background})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundAttachment: 'fixed'
  })
}

// 切换主题
const changeTheme = (theme: string) => {
  selectedTheme.value = theme
  applyBackground(themeBackgrounds[theme])
  localStorage.setItem('exam-theme', theme)
  isDropdownOpen.value = false
}

// 切换下拉
const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value
}

// 点击外部关闭
const handleClickOutside = (event: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    isDropdownOpen.value = false
  }
}

// 生命周期
onMounted(() => {
  const savedTheme = localStorage.getItem('exam-theme')
  const theme = (savedTheme && savedTheme in themeBackgrounds) ? savedTheme : 'default'
  changeTheme(theme)
  document.addEventListener('click', handleClickOutside)
})
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

// 新增：自动批改加载
function loadAutoGraded() {
  console.log('🔍 检查批改数据...', {
    storeData: examStore.highlightDataList?.length || 0,
    localStorage: localStorage.getItem('exam_highlight_data') ? '有数据' : '无数据'
  })
  
  // 先尝试从 localStorage 加载
  examStore.loadFromLocal()
  
  const hasData = examStore.highlightDataList && examStore.highlightDataList.length > 0
  const hasLocalData = localStorage.getItem('exam_highlight_data')
  
  if (!hasData && !hasLocalData) {
    ElMessage.warning('没有检测到自动批改结果，请先上传文件并等待自动批改完成')
    return
  }
  
  if (!hasData && hasLocalData) {
    ElMessage.error('检测到批改数据但加载失败，请刷新页面后重试')
    return
  }
  
  router.push('/grading').then(() => {
    ElMessage.success(`已加载 ${examStore.highlightDataList.length} 份批改结果，您可以查看和修改`)
  }).catch(err => {
    console.error('页面跳转失败:', err)
    ElMessage.error('页面跳转失败')
  })
}
</script>

<style scoped>
/* 样式同上，不变 */
.header-container {
  height: 70px;
  padding: 10px 20px;
}
.header-card {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.2);
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 25px;
  font-size: 25px;
  font-weight: bold;
  color: #333;
  transition: all 0.3s ease;
}
.header-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.25);
}
.header-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}
.icon {
  width: 16px;
  height: 16px;
  fill: currentColor;
}
.control-button {
  background: rgba(255, 255, 255, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.4);
  color: #333;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 500;
  text-transform: capitalize;
}
.control-button:hover {
  background: rgba(255, 255, 255, 0.5);
  transform: scale(1.05);
}
.theme-dropdown {
  position: relative;
}
.theme-dropdown .control-button {
  padding: 8px 16px;
}
.control-button.dropdown-open {
  border-radius: 8px 8px 0 0;
  border-bottom: 1px solid transparent;
}
.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-top: none;
  border-radius: 0 0 12px 12px;
  z-index: 1000;
  margin-top: -1px;
}
.dropdown-item {
  width: 100%;
  padding: 12px 16px;
  background: transparent;
  border: none;
  color: #333;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: all 0.2s ease;
  text-transform: capitalize;
  font-size: 14px;
}
.dropdown-item:first-child {
  padding-top: 16px;
}
.dropdown-item:last-child {
  padding-bottom: 16px;
  border-radius: 0 0 12px 12px;
}
.dropdown-item:hover {
  background: rgba(74, 144, 226, 0.1);
  color: #4a90e2;
}
.dropdown-item.active {
  background: rgba(74, 144, 226, 0.15);
  color: #4a90e2;
  font-weight: 600;
}
.check-mark {
  color: #4a90e2;
  font-weight: bold;
}
</style>
