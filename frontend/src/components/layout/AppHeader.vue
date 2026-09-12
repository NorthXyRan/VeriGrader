<template>
  <div class="header-container">
    <div class="header-card">
      <span>VeriGrader</span>
      <div class="header-controls">
        <div class="theme-dropdown" ref="dropdownRef">
          <button
            class="control-button"
            @click="toggleDropdown"
            :class="{ 'dropdown-open': isDropdownOpen }"
          >
            <Brush class="icon" />
            Theme
          </button>

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

        <button class="control-button" @click="$emit('toggleCollapse')">
          <component :is="isCollapse ? Expand : Fold" class="icon" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Brush, Expand, Fold } from '@element-plus/icons-vue'
import { onMounted, onUnmounted, ref } from 'vue'

interface Props {
  isCollapse: boolean
}
defineProps<Props>()

defineEmits<{
  toggleCollapse: []
}>()

const themes = {
  default: {
    backgroundImage: 'linear-gradient(135deg, #dbeafe 0%, #f5f3ff 52%, #e0f2fe 100%)',
    backgroundColor: '#eef5ff',
  },
  nature: {
    backgroundImage: 'linear-gradient(135deg, #dcfce7 0%, #ecfccb 50%, #cffafe 100%)',
    backgroundColor: '#edf9ed',
  },
  vibrant: {
    backgroundImage: 'linear-gradient(135deg, #fae8ff 0%, #ede9fe 50%, #ffe4e6 100%)',
    backgroundColor: '#f5edff',
  },
  white: { backgroundImage: 'none', backgroundColor: '#f5f5f7' },
} as const

type Theme = keyof typeof themes

const themeOptions: Theme[] = ['default', 'nature', 'vibrant', 'white']
const selectedTheme = ref<Theme>('default')
const isDropdownOpen = ref(false)
const dropdownRef = ref<HTMLElement>()

const isTheme = (value: string): value is Theme => themeOptions.some((theme) => theme === value)

const applyTheme = (theme: Theme) => {
  Object.assign(document.documentElement.style, themes[theme])
}

const changeTheme = (theme: Theme) => {
  selectedTheme.value = theme
  applyTheme(theme)
  try {
    localStorage.setItem('exam-theme', theme)
  } catch {}
  isDropdownOpen.value = false
}

const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value
}

const handleClickOutside = (event: MouseEvent) => {
  if (
    dropdownRef.value &&
    event.target instanceof Node &&
    !dropdownRef.value.contains(event.target)
  ) {
    isDropdownOpen.value = false
  }
}

onMounted(() => {
  let theme: Theme = 'default'
  try {
    const savedTheme = localStorage.getItem('exam-theme')
    if (savedTheme && isTheme(savedTheme)) theme = savedTheme
  } catch {}
  changeTheme(theme)
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.header-container {
  height: 70px;
  padding: 10px 20px;
  position: relative;
  z-index: 2000;
}

.header-card {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border-radius: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.2);
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 25px;
  font-size: 24px;
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
  border-radius: 24px;
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
  border-radius: 24px 24px 0 0;
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
  border-radius: 0 0 24px 24px;
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
  border-radius: 0 0 24px 24px;
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
