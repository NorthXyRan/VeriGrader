<template>
  <main class="workflow-review" :data-step="step" aria-label="Interactive grading example">
    <div class="review-roster">
      <ol class="review-students" aria-label="Students">
        <li
          v-for="student in students"
          :key="student.id"
          class="review-student"
          :class="{
            'is-current': student.id === selectedStudent,
            'is-flagged': problemIds.includes(student.id),
            'is-regrading': activeStudent === student.id,
            'is-regraded': regradedIds.has(student.id),
          }"
          :data-student-id="student.id"
          :aria-label="studentLabel(student.id)"
          :title="studentLabel(student.id)"
        >
          {{ student.id }}
        </li>
      </ol>
      <div class="review-actions" aria-label="Regrade responses">
        <button
          v-for="action in regradeActions"
          :key="action.scope"
          type="button"
          class="review-button review-button--regrade"
          :data-regrade="action.scope"
          :disabled="!standard || isRegrading || (action.scope === 'problem' && !problemIds.length)"
          @click="regradeManually(action.scope)"
        >
          <el-icon><component :is="action.icon" /></el-icon>
          {{ action.label }}
        </button>
      </div>
    </div>

    <header class="review-header">
      <div class="review-question">
        <div class="review-response-id">
          <strong>Question {{ sample.question.question_id }}</strong>
          <span>Student {{ result.student_id }}</span>
        </div>
        <p>What are the differences between interpolation and approximation?</p>
      </div>
      <span v-if="step >= 3" class="review-score">
        <strong>{{ displayScore }} / {{ sample.question.score }}</strong> marks
      </span>
    </header>

    <div ref="workspace" class="review-workspace">
      <GradingPanel class="review-panel" kind="response">
        <div class="review-tools" aria-label="Grading labels">
          <button
            v-for="verdict in verdicts"
            :key="verdict.type"
            type="button"
            class="review-button review-verdict"
            :class="`highlight-type-${verdict.type}`"
            :data-verdict="verdict.type"
            :aria-pressed="
              step >= 5 &&
              !!selection &&
              flagTexts.includes(selection.text) &&
              selection.type === verdict.type
            "
            :disabled="!canRelabel"
            @click="reviewPiece(verdict.type)"
          >
            <el-icon><component :is="verdict.icon" /></el-icon>
            {{ verdict.label }}
          </button>
        </div>
        <PaperPreview
          :student-answer="studentAnswer"
          :highlight-data="shownResult"
          :show-labels="step >= 3"
          @highlight-clicked="choosePiece"
          @highlight-cleared="clicked = null"
          @highlight-hovered="hovered = $event.text"
          @highlight-hover-cleared="hovered = null"
        />
      </GradingPanel>
      <GradingPanel class="review-panel" kind="reference">
        <ReferenceAnswer
          :reference-answer="referenceAnswer"
          :highlight-data="shownResult"
          :current-highlight="step >= 2 ? selection : null"
          :show-labels="step >= 3"
          read-only
        />
      </GradingPanel>
      <GradingPanel class="review-panel" kind="rationale">
        <p v-if="step < 4" class="review-placeholder">Rationales appear in Explain.</p>
        <FeedbackPanel
          v-else
          ref="feedback"
          :current-question-id="sample.question.question_id"
          :read-only="!canEditReason"
          :reason-examples="reasonExamples"
          :example-disabled="!hasRevisedReason || isRegrading"
          example-label="Set As Standard"
          @focusin="notifyInteraction"
          @click.capture="notifyInteraction"
          @input="markManualReason"
          @save-reason="savedReason = $event.reason"
          @submit-reason-example="setStandard"
          @cancel-reason-example="standard = null"
        />
      </GradingPanel>
    </div>

    <p class="review-status" role="status">{{ status }}</p>
    <svg class="review-links" aria-hidden="true">
      <path
        v-if="link"
        :key="linkKey"
        class="review-link"
        :class="`is-${link.type}`"
        :d="link.d"
        pathLength="1"
      />
      <circle
        v-if="link"
        :key="`${linkKey}-dot`"
        class="review-link-dot"
        :class="`is-${link.type}`"
        :cx="link.x2"
        :cy="link.y2"
        r="3.5"
      />
    </svg>
    <WorkflowCursor :target="cursorTarget" :clicks="cursorClicks" />
  </main>
</template>

<script setup lang="ts">
import FeedbackPanel from '@/components/grading/FeedbackPanel.vue'
import GradingPanel from '@/components/grading/GradingPanel.vue'
import PaperPreview from '@/components/grading/PaperPreview.vue'
import ReferenceAnswer from '@/components/grading/ReferenceAnswer.vue'
import { gradingThresholds } from '@/config/gradingThresholds'
import {
  HIGHLIGHT_TYPES,
  type HighlightData,
  type HighlightItem,
  type HighlightSelection,
  type HighlightType,
} from '@/types/exam'
import { computeScoreFromReferences } from '@/utils/highlightMetrics'
import { Check, Close, Menu, QuestionFilled, VideoPlay } from '@element-plus/icons-vue'
import { computed, onMounted, onUnmounted, ref, shallowRef, useTemplateRef, watch } from 'vue'
import WorkflowCursor from './WorkflowCursor.vue'
import sample from './cases/q1'
import { getDemoGradingResult, renderResponse } from './loadDemo'

type RegradeScope = 'one' | 'problem' | 'all'
interface RegradeBatch {
  scope: RegradeScope
  students: number[]
  completed: number
}
type ReasonExample = Pick<HighlightSelection, 'text' | 'type' | 'matchedReferenceAnswer'> & {
  reason: string
}

const selectedStudent = 6
const referenceAnswer = sample.rubric.join('\n\n')
const verdicts = [
  { type: 'correct', label: 'Correct', icon: Check },
  { type: 'wrong', label: 'Wrong', icon: Close },
  { type: 'unclear', label: 'Unclear', icon: QuestionFilled },
] as const
const regradeActions = [
  { scope: 'one', label: 'One', icon: VideoPlay },
  { scope: 'problem', label: 'Problem', icon: QuestionFilled },
  { scope: 'all', label: 'All', icon: Menu },
] as const

const students = sample.responses.map((response) => {
  const { studentId: id } = response
  const first = getDemoGradingResult(id, sample.question.question_id, { initialPass: true })
  const after = getDemoGradingResult(id, sample.question.question_id)
  if (!first || !after) throw new Error(`Missing workflow response for student ${id}`)
  return { id, answer: renderResponse(response), first, after }
})
const exemplar = students.find(({ id }) => id === selectedStudent)!
const studentAnswer = exemplar.answer
// Every piece the LLM left unclear, in reading order. The instructor settles each one in Verify.
const flags = [...exemplar.first.answer.unclear].sort(
  (left, right) =>
    studentAnswer.indexOf(left['Student answer']) - studentAnswer.indexOf(right['Student answer']),
)
const flagTexts = flags.map((item) => item['Student answer'])
// The representative borderline piece (scoring point 8) becomes the standard in Regrade.
const flag = flags.find((item) => item['matched reference answer'] === sample.rubric[7])!
const flagText = flag['Student answer']
// The settled label and rationale for each flagged piece, as the regrade returns them.
const settled = new Map(
  HIGHLIGHT_TYPES.flatMap((type) =>
    exemplar.after.answer[type].map((item) => [item['Student answer'], { type, item }] as const),
  ),
)
const LABELS: Record<HighlightType, string> = {
  correct: 'Correct',
  wrong: 'Wrong',
  unclear: 'Unclear',
}
// The instructor's rewrite of the scoring point 8 rationale, saved as the standard.
const STANDARD_RULE =
  'SP8 asks for a genuine drawback of approximation. Award it when the answer says the fitted curve does not reproduce the data exactly, or ties the quality of the fit to the choice of curve (its form, degree or smoothing), even without the words residual, underfitting or overfitting. Do not award it for a bare "it depends" or "may not be suitable" that never says on what.'
function reasonFor(text: string, type: HighlightType): string {
  const initial = flags.find((item) => item['Student answer'] === text)
  if (type === 'unclear') return initial?.reason ?? ''
  const final = settled.get(text)
  if (final?.type === type) return final.item.reason
  return `The instructor relabelled this piece as ${LABELS[type]}.`
}
// Pieces in reading order, and the scoring point number each one is aligned with.
const orderedPieces = [
  ...exemplar.first.answer.correct,
  ...exemplar.first.answer.wrong,
  ...exemplar.first.answer.unclear,
]
  .map((item) => ({
    text: item['Student answer'],
    at: studentAnswer.indexOf(item['Student answer']),
  }))
  .sort((left, right) => left.at - right.at)
// Explain walks through a confident call, another unclear one, and ends on the representative piece.
const explainTour = [
  exemplar.first.answer.correct[0]!['Student answer'],
  exemplar.first.answer.unclear.find((item) => item['Student answer'] !== flagText)![
    'Student answer'
  ],
  flagText,
]

const pieceTarget = '[data-instructor-piece]'
const rationaleTarget = '.reason-display'
const editorTarget = '.reason-textarea textarea'
const standardTarget = '.action-buttons button'
const allTarget = '[data-regrade="all"]'

const step = ref(4)
const stepProgress = ref(1)
const displayScore = ref(0)
const link = shallowRef<{ d: string; x2: number; y2: number; type: string } | null>(null)
const linkKey = ref('')
const clicked = ref<string | null>(null)
const hovered = ref<string | null>(null)
const reviews = shallowRef(new Map<string, HighlightType>())
const guided = ref<string | null>(null)
const savedReason = ref<string | null>(null)
const standard = shallowRef<ReasonExample | null>(null)
const regradedIds = shallowRef(new Set<number>())
const batch = shallowRef<RegradeBatch | null>(null)
const cursorTarget = ref<string | null>(null)
const cursorClicks = ref(0)
const workspace = useTemplateRef<HTMLElement>('workspace')
const feedback = useTemplateRef<InstanceType<typeof FeedbackPanel>>('feedback')
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
let lastProgress = 0
let appliedProgress = -1
let manualReason = false
let regradeTimer: ReturnType<typeof setInterval> | undefined

function replacePiece(
  result: HighlightData,
  text: string,
  type: HighlightType,
  item: HighlightItem,
): HighlightData {
  const keep = (entry: HighlightItem) => entry['Student answer'] !== text
  const answer = {
    correct: result.answer.correct.filter(keep),
    wrong: result.answer.wrong.filter(keep),
    unclear: result.answer.unclear.filter(keep),
  }
  answer[type].push(item)
  const updated = { ...result, answer }
  updated.total_score = computeScoreFromReferences(updated, {
    eachPoint: sample.pointsPerCriterion,
    maxScore: sample.question.score,
  })
  return updated
}

const result = computed(() => {
  let current = regradedIds.value.has(selectedStudent) ? exemplar.after : exemplar.first
  for (const [text, type] of reviews.value) {
    const initial = flags.find((item) => item['Student answer'] === text)!
    const reason =
      text === flagText && savedReason.value ? savedReason.value : reasonFor(text, type)
    current = replacePiece(current, text, type, { ...initial, reason })
  }
  return current
})
const shownResult = computed(() => {
  if (step.value >= 4) return result.value
  const { answer } = result.value
  const hideReasons = (items: HighlightItem[]) => items.map((item) => ({ ...item, reason: '' }))
  return {
    ...result.value,
    answer: {
      correct: hideReasons(answer.correct),
      wrong: hideReasons(answer.wrong),
      unclear: hideReasons(answer.unclear),
    },
  }
})

const automaticPiece = computed(() => {
  const at = (list: string[]) =>
    list[Math.min(list.length - 1, Math.floor(stepProgress.value * list.length))]
  if (step.value === 2) return at(orderedPieces.map(({ text }) => text))
  if (step.value === 4) return at(explainTour)
  return null
})

const selection = computed<HighlightSelection | null>(() => {
  const automatic = automaticPiece.value
  const text = clicked.value ?? hovered.value ?? automatic
  if (!text) return null
  for (const type of HIGHLIGHT_TYPES) {
    const item = shownResult.value.answer[type].find((entry) => entry['Student answer'] === text)
    if (item)
      return {
        text,
        type,
        reason: item.reason,
        matchedReferenceAnswer: item['matched reference answer'],
        occurrence: 0,
      }
  }
  return null
})

const isRegrading = computed(
  () => !!batch.value && batch.value.completed < batch.value.students.length,
)
const activeStudent = computed(() => batch.value?.students[batch.value.completed] ?? null)
const canRelabel = computed(
  () => step.value === 5 && !!clicked.value && flagTexts.includes(clicked.value),
)
const standardType = computed(() => reviews.value.get(flagText) ?? null)
const hasVerdict = computed(() => !!standardType.value && standardType.value !== 'unclear')
const canEditReason = computed(
  () => step.value === 6 && hasVerdict.value && clicked.value === flagText,
)
const hasRevisedReason = computed(() => {
  const draft = feedback.value?.editableReason.trim()
  return !!draft && !!standardType.value && draft !== reasonFor(flagText, standardType.value)
})
const reasonExamples = computed(() => {
  const example = standard.value
  return example
    ? [
        {
          questionId: sample.question.question_id,
          studentId: selectedStudent,
          studentAnswer: example.text,
          highlightType: example.type,
          reason: example.reason,
          matchedReferenceAnswer: example.matchedReferenceAnswer,
        },
      ]
    : []
})

const problemIds = computed(() =>
  students
    .filter((student) => {
      const grade =
        student.id === selectedStudent
          ? result.value
          : regradedIds.value.has(student.id)
            ? student.after
            : student.first
      const { correct, wrong, unclear } = grade.answer
      const total = correct.length + wrong.length + unclear.length
      return total > 0 && unclear.length / total > gradingThresholds.unclearRedundantYellow
    })
    .map(({ id }) => id),
)

const status = computed(() => {
  const current = batch.value
  if (step.value !== 6 || !current) return ''
  const total = current.students.length
  if (isRegrading.value) return `Simulating regrade · ${current.completed}/${total} complete`
  return `Simulated regrade complete · ${total} ${total === 1 ? 'response' : 'responses'}`
})

function studentLabel(studentId: number): string {
  if (studentId === activeStudent.value) return `Student ${studentId}, regrading`
  if (regradedIds.value.has(studentId)) return `Student ${studentId}, regraded`
  if (problemIds.value.includes(studentId)) return `Student ${studentId}, needs review`
  return `Student ${studentId}`
}

function post(type: 'verigrader:workflow-ready' | 'verigrader:workflow-interact') {
  if (window.parent !== window) window.parent.postMessage({ type }, window.location.origin)
}

function notifyInteraction() {
  post('verigrader:workflow-interact')
}

function choosePiece(piece: HighlightSelection) {
  notifyInteraction()
  clicked.value = piece.text
  hovered.value = null
}

function selectPiece(text: string) {
  clicked.value = text
  hovered.value = null
}

function setReview(text: string, type: HighlightType) {
  reviews.value = new Map([...reviews.value, [text, type]])
}

function markManualReason() {
  manualReason = true
}

function reviewPiece(type: HighlightType) {
  notifyInteraction()
  if (clicked.value && flagTexts.includes(clicked.value)) setReview(clicked.value, type)
}

function setStandard(example: ReasonExample) {
  if (!canEditReason.value || !hasRevisedReason.value) return
  savedReason.value = example.reason
  standard.value = example
}

function startRegrade(scope: RegradeScope) {
  if (!standard.value || isRegrading.value) return
  const eligible =
    scope === 'one'
      ? [selectedStudent]
      : scope === 'problem'
        ? problemIds.value
        : students.map(({ id }) => id)
  if (!eligible.length) return
  batch.value = { scope, students: eligible, completed: 0 }
}

function advanceRegrade(completed: number) {
  const current = batch.value
  if (!current || completed <= current.completed) return
  const next = Math.min(completed, current.students.length)
  regradedIds.value = new Set([
    ...regradedIds.value,
    ...current.students.slice(current.completed, next),
  ])
  batch.value = { ...current, completed: next }
}

function clearRegradeTimer() {
  clearInterval(regradeTimer)
  regradeTimer = undefined
}

function regradeManually(scope: RegradeScope) {
  notifyInteraction()
  startRegrade(scope)
  const current = batch.value
  if (!current || !isRegrading.value) return
  if (reduceMotion.matches) {
    advanceRegrade(current.students.length)
    return
  }
  clearRegradeTimer()
  regradeTimer = setInterval(() => {
    if (batch.value) advanceRegrade(batch.value.completed + 1)
    if (!isRegrading.value) clearRegradeTimer()
  }, 190)
}

function enterStep(nextStep: number, playing: boolean) {
  clearRegradeTimer()
  batch.value = null
  step.value = nextStep
  clicked.value = null
  hovered.value = null
  cursorTarget.value = null
  cursorClicks.value = 0
  appliedProgress = -1
  savedReason.value = null
  standard.value = null
  regradedIds.value = new Set()
  manualReason = false
  if (nextStep === 1) {
    // A new round starts from the top of both panels.
    const root = workspace.value
    for (const panel of root?.querySelectorAll<HTMLElement>(
      '.preview-content, .reference-content',
    ) ?? [])
      panel.scrollTo({ top: 0, behavior: reduceMotion.matches ? 'instant' : 'smooth' })
  }
  guided.value = nextStep === 6 ? flagText : null
  // Before Verify nothing is settled; Regrade starts from the three settled pieces.
  reviews.value =
    nextStep <= 5
      ? new Map()
      : new Map(flagTexts.map((text) => [text, settled.get(text)?.type ?? 'correct']))
  if (nextStep >= 5 && !playing && reduceMotion.matches) selectPiece(flagTexts[0]!)
}

const crossed = (progress: number, mark: number) => appliedProgress < mark && progress >= mark

// Settle each unclear piece in turn: click it (the rationale explains the doubt), then click the
// verdict (the rationale switches to why that verdict holds).
function playVerification(progress: number) {
  const count = flagTexts.length
  const index = Math.min(count - 1, Math.floor(progress * count))
  const local = progress * count - index
  const text = flagTexts[index]!
  const verdict = settled.get(text)?.type ?? 'correct'
  const at = (fraction: number) => (index + fraction) / count
  guided.value = text
  if (local >= 0.5) cursorTarget.value = `[data-verdict="${verdict}"]`
  else if (local >= 0.04) cursorTarget.value = pieceTarget
  if (crossed(progress, at(0.24))) {
    selectPiece(text)
    cursorClicks.value += 1
  }
  if (crossed(progress, at(0.72)) && !reviews.value.has(text)) {
    setReview(text, verdict)
    cursorClicks.value += 1
  }
}

function playFeedback(progress: number) {
  if (progress >= 0.88) cursorTarget.value = null
  else if (progress >= 0.63 && standard.value) cursorTarget.value = allTarget
  else if (progress >= 0.54) cursorTarget.value = standardTarget
  else if (progress >= 0.23) cursorTarget.value = editorTarget
  else if (progress >= 0.17) cursorTarget.value = rationaleTarget
  else if (progress >= 0.06) cursorTarget.value = pieceTarget

  if (crossed(progress, 0.12)) {
    selectPiece(flagText)
    cursorClicks.value += 1
  }
  const panel = feedback.value
  if (crossed(progress, 0.23) && panel) {
    panel.enterEditMode()
    cursorTarget.value = editorTarget
    cursorClicks.value += 1
  }
  if (crossed(progress, 0.27) && panel && !manualReason) panel.editableReason = ''
  if (progress >= 0.31 && panel && !manualReason && !standard.value) {
    const reason =
      standardType.value === 'correct'
        ? STANDARD_RULE
        : 'Do not credit SP8 for naming a dependence on the chosen curve without saying what a poor choice does.'
    const typed = Math.min(1, (progress - 0.31) / 0.22)
    panel.editableReason = reason.slice(0, Math.ceil(reason.length * typed))
  }
  if (crossed(progress, 0.6) && !standard.value && hasRevisedReason.value) {
    cursorClicks.value += 1
    panel?.toggleSubmitReason()
  }
  if (crossed(progress, 0.72) && !batch.value && standard.value) {
    cursorClicks.value += 1
    startRegrade('all')
  }
  if (progress >= 0.72 && batch.value?.scope === 'all' && !regradeTimer) {
    const fraction = Math.min(1, (progress - 0.72) / 0.23)
    advanceRegrade(Math.floor(fraction * batch.value.students.length + 0.0001))
  }
}

function receiveState(event: MessageEvent) {
  if (event.origin !== window.location.origin || event.source !== window.parent) return
  const state = event.data
  if (state?.type === 'verigrader:workflow-probe') {
    post('verigrader:workflow-ready')
    return
  }
  if (
    state?.type !== 'verigrader:workflow-state' ||
    !Number.isInteger(state.step) ||
    state.step < 1 ||
    state.step > 6 ||
    !Number.isFinite(state.progress) ||
    state.progress < 0 ||
    state.progress > 1 ||
    typeof state.playing !== 'boolean'
  )
    return

  if (state.step !== step.value || state.progress + 0.01 < lastProgress) {
    enterStep(state.step, state.playing)
  }
  lastProgress = state.progress
  stepProgress.value = state.playing || state.progress > 0 ? state.progress : 1
  if (!state.playing) {
    cursorTarget.value = null
    return
  }
  if (state.step === 5) playVerification(state.progress)
  if (state.step === 6) playFeedback(state.progress)
  appliedProgress = state.progress
}

watch([selection, feedback], ([highlight, panel]) => {
  if (highlight) panel?.handleHighlightClicked(highlight)
  else panel?.resetPanel()
})

watch(
  [selection, shownResult, workspace, cursorTarget, guided],
  ([highlight, , view, target]) => {
    const scroll = view?.querySelector<HTMLElement>('.preview-content')
    const pieces = scroll?.querySelectorAll<HTMLElement>('.text-highlight')
    if (!scroll || !pieces) return
    pieces.forEach((piece, index) => piece.style.setProperty('--i', String(index)))
    for (const piece of pieces) {
      const isFlag = piece.dataset.text === guided.value
      const matched = piece.dataset.text === highlight?.text
      piece.toggleAttribute('data-instructor-piece', isFlag)
      piece.toggleAttribute('data-workflow-selected', matched)
      const guideTargetsFlag = isFlag && target === pieceTarget
      if (!guideTargetsFlag && (!matched || (hovered.value && !clicked.value))) continue
      const pieceBox = piece.getBoundingClientRect()
      const viewport = scroll.getBoundingClientRect()
      if (pieceBox.top >= viewport.top && pieceBox.bottom <= viewport.bottom) continue
      scroll.scrollTo({
        top: scroll.scrollTop + pieceBox.top - viewport.top - 10,
        behavior: reduceMotion.matches ? 'instant' : 'smooth',
      })
    }
  },
  { flush: 'post' },
)

// Count the score up when the labels first appear, as in the classify step.
let scoreTimer: ReturnType<typeof setInterval> | undefined
watch(
  () => [step.value, result.value.total_score] as const,
  ([currentStep, target], previous) => {
    clearInterval(scoreTimer)
    const firstLabels = currentStep === 3 && previous?.[0] !== 3
    if (!firstLabels || reduceMotion.matches) {
      displayScore.value = target
      return
    }
    displayScore.value = 0
    scoreTimer = setInterval(() => {
      if (displayScore.value >= target) return clearInterval(scoreTimer)
      displayScore.value += 1
    }, 170)
  },
  { immediate: true },
)

// A curve from the selected piece to its scoring point, redrawn every frame while it is on screen.
let linkFrame = 0
function visibleRect(element: Element | null, scroll: Element | null, last = false) {
  if (!element || !scroll) return null
  const rects = [...element.getClientRects()]
  const rect = last ? rects[rects.length - 1] : rects[0]
  const view = scroll.getBoundingClientRect()
  if (!rect || rect.bottom < view.top + 4 || rect.top > view.bottom - 4) return null
  return rect
}
function drawLink() {
  linkFrame = requestAnimationFrame(drawLink)
  const root = workspace.value?.parentElement
  if (!root || step.value < 2 || !selection.value) {
    link.value = null
    return
  }
  const preview = root.querySelector('.preview-content')
  const reference = root.querySelector('.reference-content')
  const from = visibleRect(root.querySelector('[data-workflow-selected]'), preview, true)
  const to = visibleRect(reference?.querySelector('.reference-highlight') ?? null, reference)
  if (!from || !to) {
    link.value = null
    return
  }
  const box = root.getBoundingClientRect()
  // Leave from the response panel's edge, level with the piece, so the curve never crosses the text.
  const x1 =
    Math.min(from.right, (preview?.getBoundingClientRect().right ?? from.right) - 10) - box.left
  const y1 = from.top + from.height / 2 - box.top
  const x2 = to.left - box.left - 4
  const y2 = to.top + Math.min(to.height / 2, 11) - box.top
  if (x2 - x1 < 8) {
    link.value = null
    return
  }
  const bend = (x2 - x1) * 0.5
  const d = `M${x1.toFixed(1)} ${y1.toFixed(1)}C${(x1 + bend).toFixed(1)} ${y1.toFixed(1)} ${(x2 - bend).toFixed(1)} ${y2.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`
  const type = step.value >= 3 ? selection.value.type : 'segment'
  const key = `${selection.value.text}|${type}`
  if (key !== linkKey.value) linkKey.value = key
  link.value = { d, x2, y2, type }
}

onMounted(() => {
  linkFrame = requestAnimationFrame(drawLink)
  window.addEventListener('message', receiveState)
  post('verigrader:workflow-ready')
})

onUnmounted(() => {
  window.removeEventListener('message', receiveState)
  clearRegradeTimer()
  clearInterval(scoreTimer)
  cancelAnimationFrame(linkFrame)
})
</script>

<style scoped>
.workflow-review {
  position: relative;
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr) auto;
  gap: 6px;
  height: 100dvh;
  overflow: hidden;
  padding: 10px;
  color: #1d1d1f;
  background: #eef1f5;
}

.review-header,
.review-roster {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px 12px;
  padding: 7px 10px;
  border-radius: 12px;
  background: #fff;
}

.review-header {
  min-height: 50px;
}

.review-question {
  min-width: 0;
}

.review-response-id {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 4px 10px;
  font-size: 13px;
}

.review-response-id span,
.review-status,
.review-placeholder {
  color: #5c646e;
}

.review-question p {
  margin-top: 2px;
  font-size: 13px;
  line-height: 1.35;
}

.review-score {
  flex: none;
  padding: 4px 8px;
  color: #1465bb;
  font-size: 13px;
  line-height: 1.4;
  white-space: nowrap;
  border-radius: 999px;
  background: #e7f2ff;
}

.review-students {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.review-student {
  position: relative;
  display: grid;
  width: 23px;
  height: 23px;
  place-items: center;
  border: 1px solid #c7ead4;
  border-radius: 50%;
  color: #186840;
  background: #e4f5eb;
  font-size: 11px;
  font-weight: 650;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.review-student.is-current {
  color: #fff;
  border-color: #007aff;
  background: #007aff;
}

.review-student.is-flagged::after {
  position: absolute;
  top: -2px;
  right: -1px;
  width: 7px;
  height: 7px;
  border: 1px solid #fff;
  border-radius: 50%;
  background: #f6a63a;
  content: '';
}

.review-student.is-regrading {
  animation: review-student-pulse 0.22s ease-out both;
}

@keyframes review-student-pulse {
  0%,
  65% {
    border-color: #007aff;
    color: #fff;
    background: #007aff;
    box-shadow: 0 0 0 3px #c9e2ff;
    transform: scale(1.1);
  }
}

.review-workspace {
  display: grid;
  grid-template-columns: minmax(0, 1.3fr) repeat(2, minmax(0, 1fr));
  grid-template-rows: minmax(0, 1fr);
  gap: 8px;
  min-height: 0;
}

.review-panel {
  min-width: 0;
  min-height: 0;
  border-radius: 12px;
}

.review-panel :deep(.panel-header) {
  min-height: 34px;
  height: auto;
  padding: 7px 10px;
}

.review-panel :deep(.panel-header h3) {
  line-height: 1.2;
  font-size: 13px;
}

.review-panel :deep(.paper-preview),
.review-panel :deep(.reference-answer),
.review-panel :deep(.feedback-panel) {
  flex: 1;
  min-height: 0;
}

.review-panel :deep(.preview-content),
.review-panel :deep(.reference-content),
.review-panel :deep(.feedback-content) {
  min-height: 0;
  padding: 10px 12px;
  font-size: 14px;
  line-height: 1.6;
}

.review-panel :deep(.reason-content-text) {
  min-height: 0;
  font-size: 14px;
  line-height: 1.6;
}

.review-panel :deep(.highlight-segment) {
  border-left-color: #94b3df;
  background: #eaf2fc;
}

/* Segment: each piece is underlined in reading order, then settles into its segment tint. */
.workflow-review[data-step='1'] :deep(.preview-content .text-highlight) {
  background-image: linear-gradient(#2774c9, #2774c9);
  background-repeat: no-repeat;
  background-position: 0 100%;
  background-size: 100% 0;
  animation: segment-in 0.9s cubic-bezier(0.22, 1, 0.36, 1) both;
  animation-delay: calc(var(--i, 0) * 260ms + 300ms);
}

@keyframes segment-in {
  0% {
    background-color: transparent;
    border-left-color: transparent;
    background-size: 0 2px;
  }
  55% {
    background-color: transparent;
    border-left-color: transparent;
    background-size: 100% 2px;
  }
  100% {
    background-size: 100% 0;
  }
}

/* Classify: labels arrive piece by piece, out of the neutral segment tint. */
.workflow-review[data-step='3'] :deep(.preview-content .text-highlight) {
  animation: classify-in 0.55s ease-out both;
  animation-delay: calc(var(--i, 0) * 170ms + 150ms);
}

@keyframes classify-in {
  from {
    background-color: #eaf2fc;
    border-left-color: #94b3df;
  }
}

/* The link from the selected piece to its scoring point. */
.review-links {
  position: absolute;
  inset: 0;
  z-index: 6;
  width: 100%;
  height: 100%;
  overflow: visible;
  pointer-events: none;
}

.review-link {
  fill: none;
  stroke: #2774c9;
  stroke-width: 1.6;
  stroke-linecap: round;
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
  opacity: 0.85;
  animation: link-draw 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

.review-link-dot {
  fill: #2774c9;
  animation: link-dot 0.6s ease-out both;
}

.review-link.is-correct {
  stroke: #28a745;
}

.review-link.is-wrong {
  stroke: #dc3545;
}

.review-link.is-unclear {
  stroke: #e0a800;
}

.review-link-dot.is-correct {
  fill: #28a745;
}

.review-link-dot.is-wrong {
  fill: #dc3545;
}

.review-link-dot.is-unclear {
  fill: #e0a800;
}

@keyframes link-draw {
  to {
    stroke-dashoffset: 0;
  }
}

@keyframes link-dot {
  0%,
  70% {
    opacity: 0;
    transform: scale(0.4);
  }
}

.review-link-dot {
  transform-box: fill-box;
  transform-origin: center;
}

.review-panel :deep([data-workflow-selected]) {
  box-shadow: 0 0 0 1px #2774c9;
}

.review-placeholder {
  padding: 11px 12px;
  font-size: 14px;
  line-height: 1.5;
}

.review-panel :deep(.reason-textarea) {
  min-height: 0;
}

.review-panel :deep(.reason-textarea .el-textarea__inner) {
  border-radius: 10px;
  font-size: 14px;
  line-height: 1.6;
}

.review-panel :deep(.action-buttons) {
  padding: 6px 10px;
}

.review-panel :deep(.action-buttons .el-button) {
  width: auto;
  min-height: 27px;
  padding: 3px 10px;
  font-size: 12px;
}

.review-panel :deep(.example-indicator) {
  gap: 6px;
  margin-bottom: 8px;
  padding: 6px 8px;
  border-radius: 8px;
  font-size: 12px;
  line-height: 1.35;
}

.review-tools,
.review-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
}

.review-tools {
  flex-shrink: 0;
  padding: 6px 8px;
  border-bottom: 1px solid #eef0f3;
  background: #fbfcfd;
}

.review-button {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  min-height: 25px;
  padding: 2px 6px;
  border: 1px solid;
  border-radius: 999px;
  font: inherit;
  font-size: 11px;
  font-weight: 600;
  line-height: 1.25;
  white-space: nowrap;
  cursor: pointer;
}

.review-button:disabled {
  opacity: 0.65;
  cursor: default;
}

.review-verdict[aria-pressed='true'] {
  box-shadow: 0 0 0 1px currentColor;
}

.review-button--regrade {
  border-color: #a6cdff;
  color: #075cbb;
  background: #edf5ff;
}

.review-button--regrade[data-regrade='problem'] {
  border-color: #f0d89f;
  color: #78601c;
  background: #fff8e6;
}

.review-button--regrade[data-regrade='all'] {
  border-color: #007aff;
  color: #fff;
  background: #007aff;
}

.review-status {
  min-width: 0;
  min-height: 14px;
  font-size: 11px;
  line-height: 1.3;
}

@media (max-width: 575px) {
  .review-roster {
    flex-wrap: wrap;
  }

  .review-student {
    width: 21px;
    height: 21px;
  }

  .review-workspace {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: minmax(0, 1.3fr) minmax(0, 1fr) minmax(0, 0.95fr);
  }
}

@media (prefers-reduced-motion: reduce) {
  .workflow-review :deep(.preview-content .text-highlight),
  .review-link,
  .review-link-dot,
  .review-student.is-regrading {
    animation: none;
  }
  .review-link {
    stroke-dashoffset: 0;
  }
}
</style>
