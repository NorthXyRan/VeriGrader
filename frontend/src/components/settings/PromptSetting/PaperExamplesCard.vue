<template>
  <BaseExamplesCard
    title="PAPER EXAMPLES"
    :examples="goldPaperExamples"
    :empty-image-src="manIcon"
    empty-image-alt="No gold-standard paper examples"
    :get-example-key="getPaperExampleKey"
    :get-example-label="getPaperExampleLabel"
    :get-example-detail="getPaperExampleDetail"
    :get-detail-class="getPaperDetailClass"
    @view-example="$emit('viewExample', $event)"
    @remove-example="$emit('removeExample', $event)"
  />
</template>

<script setup lang="ts">
import BaseExamplesCard from './BaseExamplesCard.vue'
import manIcon from '@/assets/icons/man.png'
import type { GoldStandardExample } from '@/types/exam'

interface Props {
  goldPaperExamples: GoldStandardExample[]
}

defineProps<Props>()

defineEmits<{
  viewExample: [example: GoldStandardExample]
  removeExample: [example: GoldStandardExample]
}>()

const getPaperExampleKey = (example: GoldStandardExample): string => {
  return `${example.student_id}-${example.question_id}`
}

const getPaperExampleLabel = (example: GoldStandardExample): string => {
  return `Q${example.question_id} • S${example.student_id}`
}

const getPaperExampleDetail = (example: GoldStandardExample): string => {
  return `${example.total_score ?? 0} pts`
}

const getPaperDetailClass = (): string => {
  return 'score-display'
}
</script>
