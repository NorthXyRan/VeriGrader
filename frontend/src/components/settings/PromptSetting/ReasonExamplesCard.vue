<template>
  <BaseExamplesCard
    title="REASON EXAMPLES"
    :examples="reasonExamples"
    :empty-image-src="womanIcon"
    empty-image-alt="No rationale examples"
    :get-example-key="getReasonExampleKey"
    :get-example-label="getReasonExampleLabel"
    :get-example-detail="getReasonExampleDetail"
    :get-detail-class="getReasonDetailClass"
    @view-example="$emit('viewExample', $event)"
    @remove-example="$emit('removeExample', $event)"
  />
</template>

<script setup lang="ts">
import BaseExamplesCard from './BaseExamplesCard.vue'
import womanIcon from '@/assets/icons/woman.png'
import type { ReasonExample } from '@/types/exam'

interface Props {
  reasonExamples: ReasonExample[]
}

defineProps<Props>()

defineEmits<{
  viewExample: [example: ReasonExample]
  removeExample: [example: ReasonExample]
}>()

const getReasonExampleKey = (example: ReasonExample): string => {
  return `${example.questionId}-${example.studentId}-${example.studentAnswer}-${example.highlightType}-${example.matchedReferenceAnswer || ''}`
}

const getReasonExampleLabel = (example: ReasonExample): string => {
  return `Q${example.questionId} • S${example.studentId}`
}

const getReasonExampleDetail = (example: ReasonExample): string => {
  return example.highlightType
}

const getReasonDetailClass = (example: ReasonExample): string => {
  return `type-${example.highlightType}`
}
</script>
