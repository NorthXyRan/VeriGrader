<template>
  <div ref="layer" class="workflow-cursor-layer" aria-hidden="true">
    <div
      v-if="point"
      class="workflow-cursor"
      :class="{ 'is-targeted': visible }"
      :style="{ transform: `translate3d(${point.x}px, ${point.y}px, 0)` }"
    >
      <span v-if="clicks > 0" :key="clicks" class="workflow-cursor__pulse" />
      <svg width="23" height="26" viewBox="0 0 23 26" fill="none">
        <path
          d="M2.5 1.5V21L8 16l4.1 7.9 3.8-2-4.2-7.9 8.1-.5Z"
          fill="#172033"
          stroke="white"
          stroke-width="1.4"
          stroke-linejoin="round"
        />
      </svg>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, shallowRef, useTemplateRef, watch } from 'vue'

const props = defineProps<{ target: string | null; clicks: number }>()

const layer = useTemplateRef<HTMLDivElement>('layer')
const point = shallowRef<{ x: number; y: number } | null>(null)
const visible = shallowRef(false)
let canvas: HTMLElement | null = null
let resize: ResizeObserver | undefined
let mutations: MutationObserver | undefined
let reducedMotion: MediaQueryList | undefined
let frame = 0

function visibleTargetRect(target: Element, bounds: DOMRect, root: HTMLElement) {
  let { left, right, top, bottom } = bounds
  for (
    let container = target.parentElement;
    container && container !== root;
    container = container.parentElement
  ) {
    const { overflowX, overflowY } = getComputedStyle(container)
    if (overflowX === 'visible' && overflowY === 'visible') continue
    const clip = container.getBoundingClientRect()
    if (overflowX !== 'visible') {
      left = Math.max(left, clip.left)
      right = Math.min(right, clip.right)
    }
    if (overflowY !== 'visible') {
      top = Math.max(top, clip.top)
      bottom = Math.min(bottom, clip.bottom)
    }
  }

  for (const rect of target.getClientRects()) {
    const x1 = Math.max(left, rect.left)
    const x2 = Math.min(right, rect.right)
    const y1 = Math.max(top, rect.top)
    const y2 = Math.min(bottom, rect.bottom)
    if (x1 < x2 && y1 < y2) return { x: (x1 + x2) / 2, y: (y1 + y2) / 2 }
  }
  return null
}

function updatePosition() {
  frame = 0
  if (!canvas || !layer.value || !props.target || reducedMotion?.matches) {
    visible.value = false
    return
  }

  const target = canvas.querySelector(props.target)
  const bounds = layer.value.getBoundingClientRect()
  const aim = target && visibleTargetRect(target, bounds, canvas)
  if (!aim) {
    visible.value = false
    return
  }

  // Leave room for the pointer glyph beyond its tip at the right and bottom edges.
  const x = Math.round(Math.min(Math.max(5, aim.x - bounds.left), Math.max(5, bounds.width - 21)))
  const y = Math.round(Math.min(Math.max(5, aim.y - bounds.top), Math.max(5, bounds.height - 26)))
  if (point.value?.x !== x || point.value.y !== y) point.value = { x, y }
  visible.value = true
}

function schedulePosition() {
  if (!frame) frame = requestAnimationFrame(updatePosition)
}

watch(() => props.target, schedulePosition, { flush: 'post' })

onMounted(() => {
  canvas = layer.value?.closest('.workflow-review') ?? null
  if (!canvas) return

  reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
  reducedMotion.addEventListener('change', schedulePosition)
  canvas.addEventListener('scroll', schedulePosition, { capture: true, passive: true })
  resize = new ResizeObserver(schedulePosition)
  resize.observe(canvas)
  mutations = new MutationObserver(schedulePosition)
  mutations.observe(canvas, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['hidden', 'class', 'data-instructor-piece'],
  })
  schedulePosition()
})

onUnmounted(() => {
  canvas?.removeEventListener('scroll', schedulePosition, true)
  reducedMotion?.removeEventListener('change', schedulePosition)
  resize?.disconnect()
  mutations?.disconnect()
  cancelAnimationFrame(frame)
})
</script>

<style scoped>
.workflow-cursor-layer {
  position: absolute;
  inset: 0;
  z-index: 8;
  overflow: hidden;
  pointer-events: none;
}

.workflow-cursor {
  position: absolute;
  top: 0;
  left: 0;
  opacity: 0;
  transition:
    transform 0.85s cubic-bezier(0.65, 0, 0.35, 1),
    opacity 0.15s ease-out;
}

.workflow-cursor.is-targeted {
  opacity: 1;
}

.workflow-cursor svg {
  position: absolute;
  top: -1.5px;
  left: -2.5px;
  filter: drop-shadow(0 1px 2px rgb(15 23 42 / 0.42));
}

.workflow-cursor__pulse {
  position: absolute;
  top: -10px;
  left: -10px;
  width: 20px;
  height: 20px;
  border: 2px solid #2b59ff;
  border-radius: 50%;
  animation: workflow-cursor-click 0.48s ease-out both;
}

@keyframes workflow-cursor-click {
  from {
    opacity: 0.8;
    transform: scale(0.3);
  }
  to {
    opacity: 0;
    transform: scale(1.5);
  }
}

@media (prefers-reduced-motion: reduce) {
  .workflow-cursor-layer {
    display: none;
  }
}
</style>
