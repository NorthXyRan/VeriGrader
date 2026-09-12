<template>
  <div class="prompt-card">
    <div class="card-content">
      <div class="card-badge">OUTPUT FORMAT</div>
      <div class="apple-structure-body">
        <div class="apple-json-container">
          <pre class="apple-json-display">{{ formatJsonStructure(promptData.output_format) }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  promptData: {
    output_format: unknown
  }
}

defineProps<Props>()

const formatJsonStructure = (structure: unknown) => {
  return JSON.stringify(structure, null, 2)
}
</script>

<style scoped>
.apple-structure-body {
  flex: 1;
  overflow: hidden;
}

.apple-json-container {
  height: 100%;
  overflow: hidden;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.apple-json-display {
  background: #1d1d1f;
  color: #f5f5f7;
  padding: 20px;
  font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
  font-size: 12px;
  line-height: 1.4;
  overflow: auto;
  margin: 0;
  height: 100%;
  border-radius: 12px;
}

@media (max-width: 1200px) {
  .apple-json-display {
    font-size: 11px;
    padding: 16px;
  }
}
</style>
