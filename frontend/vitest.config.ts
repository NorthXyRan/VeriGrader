import { fileURLToPath, URL } from 'node:url'

import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    environmentOptions: {
      jsdom: { url: 'http://localhost/' },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary'],
      include: [
        'src/composables/useFewShotManager.ts',
        'src/composables/useHighlightDataOperations.ts',
        'src/services/file/fileValidation.ts',
        'src/services/llm/baseLLMService.ts',
        'src/services/llm/jsonResponse.ts',
        'src/services/llm/grading/gradingResult.ts',
        'src/stores/useExamDataStore.ts',
        'src/stores/useUploadStatusStore.ts',
        'src/utils/asyncUtils.ts',
        'src/utils/highlightMetrics.ts',
        'src/utils/highlightRanges.ts',
        'src/utils/highlightUtils.ts',
        'src/utils/scoreBands.ts',
        'src/utils/selectionUtils.ts',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        statements: 80,
        branches: 75,
      },
    },
  },
})
