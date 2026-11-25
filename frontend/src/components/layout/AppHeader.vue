<template>
  <header class="header-container">
    <div class="header-card">
      <div class="header-title">
        <span>VeriGrader</span>
        <small v-if="isPagesDemo">Simulated grading</small>
      </div>
      <div class="header-controls">
        <div class="theme-dropdown" ref="dropdownRef">
          <button
            type="button"
            class="control-button"
            aria-haspopup="true"
            :aria-expanded="isDropdownOpen"
            @click="toggleDropdown"
            :class="{ 'dropdown-open': isDropdownOpen }"
          >
            <Brush class="icon" />
            Theme
          </button>

          <div v-show="isDropdownOpen" class="dropdown-menu">
            <button
              type="button"
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

        <button
          v-if="showCollapseToggle"
          type="button"
          class="control-button control-button--icon"
          :aria-label="isCollapse ? 'Expand sidebar' : 'Collapse sidebar'"
          @click="$emit('toggleCollapse')"
        >
          <component :is="isCollapse ? Expand : Fold" class="icon" />
        </button>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { isPagesDemo } from '@/config/deployment'
import { Brush, Expand, Fold } from '@element-plus/icons-vue'
import { onMounted, onUnmounted, ref } from 'vue'

interface Props {
  isCollapse: boolean
  showCollapseToggle?: boolean
}
withDefaults(defineProps<Props>(), { showCollapseToggle: true })

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
  height: var(--app-header-height);
  padding: 10px var(--shell-gutter) 0;
  position: relative;
  z-index: 2000;
}

.header-card {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 0 12px 0 24px;
  background: var(--surface-glass);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-soft);
  color: var(--text-strong);
}

.header-title {
  min-width: 0;
  font-size: 22px;
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.02em;
}

.header-title small {
  display: block;
  margin-top: 2px;
  color: #52637a;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0;
  white-space: nowrap;
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.icon {
  width: 16px;
  height: 16px;
  fill: currentColor;
}

.control-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 40px;
  padding: 0 16px;
  background: rgba(255, 255, 255, 0.5);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-pill);
  color: var(--text-strong);
  cursor: pointer;
  font: inherit;
  font-size: 14px;
  font-weight: 500;
  text-transform: capitalize;
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease;
}

.control-button--icon {
  width: 40px;
  padding: 0;
}

.control-button:hover {
  background: rgba(255, 255, 255, 0.9);
  border-color: rgba(15, 23, 42, 0.14);
}

.control-button:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.theme-dropdown {
  position: relative;
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  min-width: 160px;
  padding: 6px;
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(12px);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lifted);
  z-index: 1000;
}

.dropdown-item {
  width: 100%;
  min-height: 40px;
  padding: 0 12px;
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  color: var(--text-strong);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: background-color 0.15s ease;
  text-transform: capitalize;
  font: inherit;
  font-size: 14px;
}

.dropdown-item:hover {
  background: rgba(74, 144, 226, 0.1);
  color: #3870a8;
}

.dropdown-item.active {
  background: rgba(74, 144, 226, 0.15);
  color: #3870a8;
  font-weight: 600;
}

.check-mark {
  color: #4a90e2;
  font-weight: bold;
}

@media (max-width: 760px) {
  .header-card {
    padding: 0 8px 0 16px;
  }

  .header-title {
    font-size: 20px;
  }

  .control-button {
    min-height: 44px;
  }
}
</style>
