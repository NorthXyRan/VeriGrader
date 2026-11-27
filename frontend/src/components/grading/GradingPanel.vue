<template>
  <div class="grading-card">
    <div class="panel-header">
      <el-icon class="panel-icon" :class="`panel-icon--${kind}`">
        <component :is="panels[kind].icon" />
      </el-icon>
      <h3>{{ panels[kind].title }}</h3>
    </div>
    <slot />
  </div>
</template>

<script setup lang="ts">
import { ChatDotSquare, EditPen, Notebook } from '@element-plus/icons-vue'

const panels = {
  response: { icon: EditPen, title: 'Student Response' },
  reference: { icon: Notebook, title: 'Reference Answer' },
  rationale: { icon: ChatDotSquare, title: 'Scoring Rationale' },
}

defineProps<{ kind: keyof typeof panels }>()
</script>

<style scoped>
.panel-header {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  gap: 8px;
  height: 46px;
  padding: 0 18px;
  background: #ffffff;
  border-bottom: 1px solid #eef0f3;
}

.panel-header h3 {
  margin: 0;
  color: #1d1d1f;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.panel-icon {
  font-size: 16px;
}

.panel-icon--response {
  color: #007aff;
}

.panel-icon--reference {
  color: #2fb84f;
}

.panel-icon--rationale {
  color: #8e5cf7;
}
</style>
