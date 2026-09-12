<template>
  <div class="prompt-card">
    <div class="card-content">
      <div class="card-badge">{{ title }}</div>

      <div class="apple-examples-body">
        <div v-if="examples.length === 0" class="card-empty">
          <img :src="emptyImageSrc" :alt="emptyImageAlt" class="card-empty-image" />
        </div>
        <div v-else class="apple-examples-grid">
          <div v-for="example in examples" :key="getExampleKey(example)" class="apple-example-item">
            <div class="example-info">
              <span class="example-label">{{ getExampleLabel(example) }}</span>
              <div class="example-detail" :class="getDetailClass(example)">
                {{ getExampleDetail(example) }}
              </div>
            </div>
            <div class="example-actions">
              <el-button
                size="small"
                type="primary"
                @click="$emit('viewExample', example)"
                class="card-button"
              >
                View
              </el-button>
              <el-button
                size="small"
                type="danger"
                @click="$emit('removeExample', example)"
                class="card-button"
              >
                Remove
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" generic="T">
interface Props {
  title: string
  examples: T[]
  emptyImageSrc: string
  emptyImageAlt: string
  getExampleKey: (example: T) => string
  getExampleLabel: (example: T) => string
  getExampleDetail: (example: T) => string
  getDetailClass: (example: T) => string
}

defineProps<Props>()

defineEmits<{
  viewExample: [example: T]
  removeExample: [example: T]
}>()
</script>

<style scoped>
.apple-examples-body {
  flex: 1;
  display: flex;
  flex-direction: column;

  height: 100%;
  min-height: 0;
}

.apple-examples-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  overflow-y: auto;
  padding-right: 4px;
  min-height: 0;
}

.apple-examples-grid::-webkit-scrollbar {
  width: 4px;
}

.apple-examples-grid::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.03);
  border-radius: 2px;
}

.apple-examples-grid::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 2px;
  transition: background 0.2s ease;
}

.apple-examples-grid::-webkit-scrollbar-thumb:hover {
  background-color: rgba(0, 0, 0, 0.3);
}

.apple-example-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.apple-example-item:hover {
  background: rgba(0, 0, 0, 0.04);
}

.example-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.example-label {
  font-size: 14px;
  font-weight: 500;
  color: #1d1d1f;
  font-family:
    -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif;
}

.example-detail {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 8px;
  width: fit-content;
}

.score-display {
  font-size: 12px;
  font-weight: 600;
  color: #30d158;
  background: rgba(48, 209, 88, 0.1);
}

.example-actions {
  display: flex;
  gap: 6px;
}
</style>
