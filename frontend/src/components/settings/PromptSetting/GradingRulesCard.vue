<template>
  <div class="prompt-card" @click="handleCardClick">
    <div class="card-content">
      <div class="card-badge">Grading Rules</div>

      <div class="hint-text">
        Select a rule to view its definition. Select outside the expanded card to return.
      </div>

      <div :class="['apple-rules-container', { zoomed: expandedCard }]">
        <div
          v-show="expandedCard"
          class="expanded-card"
          :class="[
            `expanded-${expandedCard?.type}`,
            `position-${expandedCard?.type}`,
            { expanding: isExpanding, collapsing: isCollapsing },
          ]"
          @click.stop
        >
          <div class="expanded-header">
            <div :class="`rule-indicator ${expandedCard?.type}-indicator`" aria-hidden="true"></div>
            <h3>{{ expandedCard?.title }}</h3>
          </div>

          <div class="expanded-content">
            <div v-if="expandedCard?.type === 'unclear'" class="unclear-definitions">
              <div
                v-for="(desc, type) in promptData.grading_rules['Unclear Answers']"
                :key="type"
                class="unclear-def-item"
              >
                <h4 class="unclear-def-title">{{ type }}</h4>
                <p class="unclear-def-text">{{ desc }}</p>
              </div>
            </div>

            <div v-else class="single-definition">
              <p class="expanded-definition">{{ expandedCard?.definition }}</p>
            </div>
          </div>
        </div>

        <div
          class="rules-grid"
          :class="{
            'grid-hidden': expandedCard && !isCollapsing,
            'grid-visible': !expandedCard || isCollapsing,
          }"
        >
          <button
            v-for="rule in rules"
            :key="rule.type"
            type="button"
            :class="['rule-grid-card', `${rule.type}-rule`]"
            @click.stop="expandCard(rule)"
          >
            <div :class="`rule-indicator ${rule.type}-indicator`" aria-hidden="true"></div>

            <h4 class="rule-title">{{ rule.title }}</h4>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

interface Props {
  promptData: {
    grading_rules: {
      'Correct Answers': string
      'Wrong Answers': string
      'Unclear Answers': Record<string, string>
    }
  }
}

interface RuleCard {
  type: 'correct' | 'wrong' | 'unclear'
  title: string
  definition?: string
}

const props = defineProps<Props>()

const expandedCard = ref<RuleCard | null>(null)
const isExpanding = ref(false)
const isCollapsing = ref(false)

const rules = computed<RuleCard[]>(() => [
  {
    type: 'correct',
    title: 'Correct',
    definition: props.promptData.grading_rules['Correct Answers'],
  },
  {
    type: 'wrong',
    title: 'Wrong',
    definition: props.promptData.grading_rules['Wrong Answers'],
  },
  {
    type: 'unclear',
    title: 'Unclear',
  },
])

const expandCard = (rule: RuleCard) => {
  expandedCard.value = rule
  isExpanding.value = true
  isCollapsing.value = false

  setTimeout(() => {
    isExpanding.value = false
  }, 400)
}

const handleCardClick = () => {
  if (expandedCard.value && !isCollapsing.value) {
    isCollapsing.value = true
    isExpanding.value = false

    setTimeout(() => {
      expandedCard.value = null
      isCollapsing.value = false
    }, 400)
  }
}
</script>

<style scoped>
.prompt-card {
  flex: 1;
  height: 100%;
}

.hint-text {
  font-size: 18px;
  color: #86868b;
  text-align: center;
  margin: 2px 0 18px 0;
  font-weight: 400;
  line-height: 1.4;
  font-family:
    -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif;
  user-select: none;
  cursor: default;
}

.apple-rules-container {
  flex: 1;
  position: relative;
  overflow: hidden;
  margin: -8px;
  padding: 8px;
}

.rules-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
  transition: opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  opacity: 1;
}

.grid-hidden {
  opacity: 0;
  pointer-events: none;
}

.grid-visible {
  opacity: 1;
  pointer-events: auto;
}

.rule-grid-card {
  width: 100%;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 16px;
  padding: 24px;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  gap: 16px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(0, 0, 0, 0.06);
  cursor: pointer;
  position: relative;
  overflow: hidden;
  font: inherit;
}

.rule-grid-card:hover {
  background: rgba(0, 0, 0, 0.04);
  transform: scale(1.02);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.rule-grid-card:focus-visible {
  outline: 3px solid rgba(0, 122, 255, 0.35);
  outline-offset: 2px;
}

.rule-indicator {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  flex-shrink: 0;
  transition: all 0.3s ease;
}

.correct-indicator {
  background: #30d158;
  box-shadow: 0 0 0 4px rgba(48, 209, 88, 0.2);
}

.wrong-indicator {
  background: #ff3b30;
  box-shadow: 0 0 0 4px rgba(255, 59, 48, 0.2);
}

.unclear-indicator {
  background: #ff9500;
  box-shadow: 0 0 0 4px rgba(255, 149, 0, 0.2);
}

.rule-title {
  font-size: 18px;
  font-weight: 600;
  color: #1d1d1f;
  margin: 0;
  text-align: left;
  font-family:
    -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif;
  transition: all 0.3s ease;
}

.expanded-card {
  position: absolute;
  top: 8px;
  left: 8px;
  right: 8px;
  bottom: 8px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  border: 2px solid transparent;
  overflow-y: auto;
  z-index: 10;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: transform, opacity;
}

.expanded-card::-webkit-scrollbar {
  width: 6px;
}

.expanded-card::-webkit-scrollbar-track {
  background: transparent;
  border-radius: 3px;
}

.expanded-card::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
  transition: all 0.2s ease;
}

.expanded-card::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.35);
}

.expanded-card::-webkit-scrollbar-thumb:active {
  background: rgba(0, 0, 0, 0.5);
}

.expanded-card {
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
  scroll-behavior: smooth;
}

.position-correct {
  transform-origin: 50% 0%;
}
.position-wrong {
  transform-origin: 50% 50%;
}
.position-unclear {
  transform-origin: 50% 100%;
}

.expanding {
  animation: expandCard 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

.collapsing {
  animation: collapseCard 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

@keyframes expandCard {
  0% {
    opacity: 0;
    transform: scale(0.1);
  }
  50% {
    opacity: 0.5;
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes collapseCard {
  0% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
  }
  100% {
    opacity: 0;
    transform: scale(0.1);
  }
}

.expanded-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  flex-shrink: 0;
}

.expanded-header h3 {
  font-size: 20px;
  font-weight: 600;
  color: #1d1d1f;
  margin: 0;
  font-family:
    -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif;
}

.expanded-header .rule-indicator {
  width: 18px;
  height: 18px;
}

.expanded-content {
  flex: 1;
}

.single-definition {
  height: 100%;
}

.expanded-definition {
  font-size: 16px;
  font-weight: 400;
  color: #515154;
  line-height: 1.6;
  margin: 0;
  font-family:
    -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif;
}

.unclear-definitions {
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: 100%;
}

.unclear-def-item {
  background: rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  padding: 20px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  flex-shrink: 0;
}

.unclear-def-title {
  font-size: 16px;
  font-weight: 600;
  color: #ff9500;
  margin: 0 0 12px 0;
  font-family:
    -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif;
}

.unclear-def-text {
  font-size: 15px;
  font-weight: 400;
  color: #515154;
  line-height: 1.5;
  margin: 0;
  font-family:
    -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif;
}

.expanded-correct {
  border-color: #30d158;
}

.expanded-wrong {
  border-color: #ff3b30;
}

.expanded-unclear {
  border-color: #ff9500;
}

@media (max-width: 1200px) {
  .rule-grid-card {
    padding: 20px;
  }

  .rule-title {
    font-size: 16px;
  }

  .expanded-card {
    padding: 24px;
  }

  .expanded-header h3 {
    font-size: 18px;
  }

  .expanded-definition {
    font-size: 14px;
  }
}

@media (max-width: 768px) {
  .hint-text {
    font-size: 16px;
    margin: 2px 0 14px 0;
  }

  .apple-rules-container {
    margin: -4px;
    padding: 4px;
  }

  .rules-grid {
    gap: 12px;
  }

  .rule-grid-card {
    padding: 16px;
  }

  .rule-title {
    font-size: 14px;
  }

  .expanded-card {
    padding: 20px;
    top: 4px;
    left: 4px;
    right: 4px;
    bottom: 4px;
  }

  .expanded-header h3 {
    font-size: 16px;
  }
}
</style>
