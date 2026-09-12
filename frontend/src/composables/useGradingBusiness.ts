import { Message } from '@/components/Message'
import { useQualityFlag } from '@/composables/useQualityFlag'
import {
  checkGradingServiceStatus,
  gradeSingleStudentAnswer,
  gradeSingleStudentAnswerWithFewShot,
} from '@/services/llm/grading/gradingLLMService'
import {
  checkReasonGenerationServiceStatus,
  generateReasonForHighlight,
} from '@/services/llm/grading/reasonGenerationService'
import { useExamDataStore } from '@/stores/useExamDataStore'
import type { HighlightData, HighlightType } from '@/types/exam'
import { mapWithConcurrency, withTimeout } from '@/utils/asyncUtils'
import {
  calcHighlightMissingRate,
  calcHighlightOverlapRate,
  computeScoreFromReferences,
  sanitizeHighlightData,
} from '@/utils/highlightMetrics'
import { getSelectionStats, selectStudents, validateSelection } from '@/utils/selectionUtils'

import { ErrorType, useErrorHandler } from './useErrorHandler'
import { useFewShotManager } from './useFewShotManager'
import { useHighlightDataOperations } from './useHighlightDataOperations'

const REQUEST_TIMEOUT_MS = 5 * 60 * 1_000
const MAX_CONCURRENT_REQUESTS = 8

let activeGradingMessageId: string | null = null
const singleGradingMessages = new Map<string, string>()

export type BatchMode = number | 'overlap' | 'missing' | 'red' | 'orange' | 'color' | 'all'

interface ActionSectionApi {
  resetGradingState: (studentId: number) => void
  setBatchGradingState: (active: boolean) => void
  resetBatchGradingState: () => void
}

interface FeedbackPanelApi {
  handleHighlightClicked: (highlight: { text: string; type: HighlightType; reason: string }) => void
}

type ComponentRef<Api> = { value?: Api | null }

function paperKey(studentId: number, questionId: number): string {
  return `${studentId}-${questionId}`
}

function batchModeLabel(mode: BatchMode): string {
  if (typeof mode === 'number') return `${mode} papers`
  return {
    overlap: 'Overlapping highlights',
    missing: 'Missing highlights',
    red: 'Red-flagged papers',
    orange: 'Orange-flagged papers',
    color: 'Flagged papers',
    all: 'All papers',
  }[mode]
}

export function useGradingBusiness() {
  const examStore = useExamDataStore()
  const { handleError, handleGradingError } = useErrorHandler()
  const { saveAnnotation } = useHighlightDataOperations()
  const { buildFewShotPrompt } = useFewShotManager()
  const { qualityFlag } = useQualityFlag()

  function validateQuestion(questionId: number) {
    const service = checkGradingServiceStatus()
    if (!service.available) throw new Error(service.message)

    const question = examStore.getQuestionById(questionId)
    const referenceAnswer = examStore.getReferenceAnswer(questionId)
    if (!question) throw new Error(`Question ${questionId} was not found`)
    if (!referenceAnswer)
      throw new Error(`Reference answer for question ${questionId} was not found`)

    return { question, referenceAnswer, fewShotPrompt: buildFewShotPrompt(questionId) }
  }

  async function gradeStudent(
    studentId: number,
    questionId: number,
    maxRetries = 3,
    signal?: AbortSignal,
  ): Promise<HighlightData> {
    const { question, referenceAnswer, fewShotPrompt } = validateQuestion(questionId)
    const studentAnswer = examStore.getStudentAnswer(studentId, questionId)
    if (!studentAnswer) {
      throw new Error(`Student ${studentId} has no answer for question ${questionId}`)
    }

    const request = { question, referenceAnswer, studentAnswer, signal }
    const response = fewShotPrompt
      ? await gradeSingleStudentAnswerWithFewShot({ ...request, fewShotPrompt }, maxRetries)
      : await gradeSingleStudentAnswer(request, maxRetries)

    if (!response.success || !response.data?.length) {
      throw new Error(response.error || 'Grading returned no result')
    }

    const result = sanitizeHighlightData(studentAnswer.answer, response.data[0], {
      referenceContent: referenceAnswer.answer,
    })
    result.total_score = computeScoreFromReferences(result, {
      eachPoint: referenceAnswer.eachScoringPoint || 1,
      maxScore: question.score,
    })
    return result
  }

  async function executeSingleGrading(
    studentId: number,
    questionId: number,
    actionSectionRef?: ComponentRef<ActionSectionApi>,
  ): Promise<void> {
    if (!examStore.isDataComplete) {
      Message.warning('Please upload the paper, reference answers, and student answers first')
      return
    }
    if (examStore.isGoldPaper(studentId, questionId)) {
      Message.warning('Gold-standard papers cannot be regraded')
      return
    }
    if (examStore.isConfirmedPaper(studentId, questionId)) {
      Message.warning('Confirmed papers cannot be regraded until confirmation is removed')
      return
    }

    const key = paperKey(studentId, questionId)
    const existingMessage = singleGradingMessages.get(key)
    if (existingMessage) Message.close(existingMessage)

    const existingResult = examStore.getHighlightData(studentId, questionId)
    const messageId = Message.grading({
      message: existingResult
        ? `Regrading Q${questionId}, student ${studentId} (previously ${existingResult.total_score} points)`
        : `Grading Q${questionId}, student ${studentId}`,
      type: 'grading',
      duration: 0,
      showIcon: true,
      status: 'in-progress',
      completedStudents: [],
    })
    singleGradingMessages.set(key, messageId)

    try {
      const result = await withTimeout(
        (signal) => gradeStudent(studentId, questionId, 3, signal),
        REQUEST_TIMEOUT_MS,
      )
      if (!examStore.addHighlightData(result)) {
        throw new Error('The result was locked before grading completed')
      }
      examStore.saveToLocal()
      Message.updateGrading(messageId, {
        message: `Q${questionId}, student ${studentId}: ${result.total_score} points`,
        status: 'completed',
        duration: 2_000,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown grading error'
      Message.updateGrading(messageId, {
        message: `Q${questionId}, student ${studentId}: ${message}`,
        status: 'failed',
        duration: 3_000,
      })
      handleGradingError(error)
    } finally {
      singleGradingMessages.delete(key)
      actionSectionRef?.value?.resetGradingState(studentId)
    }
  }

  async function gradeQuestionParallel(
    questionId: number,
    studentIds: number[],
    showProgress = true,
    parentMessageId?: string,
  ) {
    const totalCount = studentIds.length
    let completedCount = 0
    let successCount = 0
    let errorCount = 0
    let localMessageId: string | null = null

    if (showProgress) {
      if (activeGradingMessageId) Message.close(activeGradingMessageId)
      localMessageId = Message.grading({
        message: `Question ${questionId}`,
        type: 'grading',
        duration: 0,
        showIcon: true,
        status: 'in-progress',
        progress: { current: 0, total: totalCount },
        completedStudents: [],
      })
      activeGradingMessageId = localMessageId
    }

    const updateProgress = () => {
      const messageId = parentMessageId || localMessageId
      if (!messageId) return
      Message.updateGrading(messageId, {
        progress: { current: completedCount, total: totalCount },
        status: 'in-progress',
      })
    }

    await mapWithConcurrency(studentIds, MAX_CONCURRENT_REQUESTS, async (studentId) => {
      try {
        const result = await withTimeout(
          (signal) => gradeStudent(studentId, questionId, 3, signal),
          REQUEST_TIMEOUT_MS,
        )
        if (!examStore.addHighlightData(result)) {
          throw new Error('The result was locked before grading completed')
        }
        successCount += 1
        if (parentMessageId) {
          Message.addCompletedStudent(parentMessageId, {
            studentId,
            score: result.total_score,
          })
        }
      } catch {
        errorCount += 1
      } finally {
        completedCount += 1
        updateProgress()
      }
    })

    examStore.saveToLocal()
    if (localMessageId) {
      Message.updateGrading(localMessageId, {
        message: `Question ${questionId}: ${successCount}/${totalCount} graded`,
        status: successCount > 0 || totalCount === 0 ? 'completed' : 'failed',
        duration: 2_000,
        progress: { current: totalCount, total: totalCount },
      })
      activeGradingMessageId = null
    }

    return { successCount, errorCount, totalCount }
  }

  function eligibleStudents(questionId: number): number[] {
    return examStore.studentList
      .map((student) => student.id)
      .filter(
        (studentId) =>
          !examStore.isGoldPaper(studentId, questionId) &&
          !examStore.isConfirmedPaper(studentId, questionId),
      )
  }

  function selectBatchStudents(mode: BatchMode, questionId: number): number[] {
    const eligible = eligibleStudents(questionId)
    if (typeof mode === 'number') {
      const selected = selectStudents(eligible, mode)
      const validation = validateSelection(eligible, selected, mode)
      if (!validation.valid) throw new Error(validation.errors.join(', '))
      return selected
    }

    if (mode === 'all') return eligible
    if (mode === 'red' || mode === 'orange' || mode === 'color') {
      return eligible.filter((studentId) => {
        const flag = qualityFlag(studentId, questionId).value
        return mode === 'color' ? flag === 'red' || flag === 'orange' : flag === mode
      })
    }

    return examStore.highlightDataList
      .filter(
        (highlight) =>
          highlight.question_id === questionId && eligible.includes(highlight.student_id),
      )
      .filter((highlight) => {
        const content = examStore.getStudentAnswer(highlight.student_id, questionId)?.answer || ''
        return mode === 'overlap'
          ? calcHighlightOverlapRate(content, highlight) > 0
          : calcHighlightMissingRate(content, highlight) > 0
      })
      .map((highlight) => highlight.student_id)
  }

  async function executeBatchGrading(
    mode: BatchMode,
    questionId: number,
    actionSectionRef?: ComponentRef<ActionSectionApi>,
  ): Promise<void> {
    if (!examStore.isDataComplete) {
      Message.warning('Please upload the paper, reference answers, and student answers first')
      return
    }

    actionSectionRef?.value?.setBatchGradingState(true)
    try {
      const studentIds = selectBatchStudents(mode, questionId)
      if (!studentIds.length) {
        Message.info('No eligible papers match this batch')
        return
      }

      const stats = getSelectionStats(eligibleStudents(questionId), studentIds)
      if (activeGradingMessageId) Message.close(activeGradingMessageId)
      activeGradingMessageId = Message.grading({
        message: `${batchModeLabel(mode)} (${stats.selectedCount})`,
        type: 'grading',
        duration: 0,
        showIcon: true,
        status: 'in-progress',
        progress: { current: 0, total: studentIds.length },
        subMessages: [],
        completedStudents: [],
      })
      Message.addSubMessage(activeGradingMessageId, {
        message: `Question ${questionId}`,
        status: 'in-progress',
      })

      const result = await gradeQuestionParallel(
        questionId,
        studentIds,
        false,
        activeGradingMessageId,
      )
      Message.updateSubMessage(activeGradingMessageId, 0, {
        message: `Question ${questionId}: ${result.successCount}/${result.totalCount} completed`,
        status: result.successCount > 0 ? 'completed' : 'failed',
      })
      Message.updateGrading(activeGradingMessageId, {
        message: batchModeLabel(mode),
        status: result.successCount > 0 ? 'completed' : 'failed',
        progress: { current: result.totalCount, total: result.totalCount },
        duration: 3_000,
      })
      activeGradingMessageId = null
    } catch (error) {
      handleGradingError(error)
      if (activeGradingMessageId) {
        Message.updateGrading(activeGradingMessageId, {
          message: 'Batch grading failed',
          status: 'failed',
          duration: 3_000,
        })
        activeGradingMessageId = null
      }
    } finally {
      actionSectionRef?.value?.resetBatchGradingState()
    }
  }

  async function executeInitialGrading(): Promise<void> {
    if (!examStore.isDataComplete) {
      Message.warning('Please upload the paper, reference answers, and student answers first')
      return
    }

    const questionIds = examStore.questions.map((question) => question.question_id)
    let successCount = 0
    let errorCount = 0

    if (activeGradingMessageId) Message.close(activeGradingMessageId)
    activeGradingMessageId = Message.grading({
      message: 'Initial grading',
      type: 'grading',
      duration: 0,
      showIcon: true,
      status: 'in-progress',
      progress: { current: 0, total: questionIds.length },
      subMessages: [],
      completedStudents: [],
    })
    const messageId = activeGradingMessageId
    questionIds.forEach((questionId) =>
      Message.addSubMessage(messageId, {
        message: `Question ${questionId}`,
        status: 'in-progress',
      }),
    )

    try {
      for (const [index, questionId] of questionIds.entries()) {
        const result = await gradeQuestionParallel(questionId, eligibleStudents(questionId), false)
        successCount += result.successCount
        errorCount += result.errorCount
        Message.updateSubMessage(activeGradingMessageId, index, {
          message: `Question ${questionId}: ${result.successCount}/${result.totalCount} completed`,
          status: result.errorCount === 0 ? 'completed' : 'failed',
        })
        Message.updateGrading(activeGradingMessageId, {
          message: 'Initial grading',
          progress: { current: index + 1, total: questionIds.length },
          status: 'in-progress',
        })
      }

      Message.updateGrading(activeGradingMessageId, {
        message: `Initial grading: ${successCount} succeeded, ${errorCount} failed`,
        status: errorCount === 0 ? 'completed' : successCount > 0 ? 'completed' : 'failed',
        duration: 5_000,
        progress: { current: questionIds.length, total: questionIds.length },
      })
    } catch (error) {
      Message.updateGrading(activeGradingMessageId, {
        message: error instanceof Error ? error.message : 'Initial grading failed',
        status: 'failed',
        duration: 3_000,
      })
    } finally {
      activeGradingMessageId = null
    }
  }

  async function generateReasonWithFeedback(
    text: string,
    type: HighlightType,
    studentId: number,
    questionId: number,
    feedbackPanelRef?: ComponentRef<FeedbackPanelApi>,
  ): Promise<void> {
    const updateFeedback = (reason: string) =>
      feedbackPanelRef?.value?.handleHighlightClicked({ text, type, reason })

    const service = checkReasonGenerationServiceStatus()
    if (!service.available) {
      handleError(service.message, ErrorType.SERVICE_UNAVAILABLE, 'reason_generation')
      updateFeedback('The language-model service is unavailable. Check the connection and retry.')
      return
    }

    const question = examStore.getQuestionById(questionId)
    const referenceAnswer = examStore.getReferenceAnswer(questionId)
    const studentAnswer = examStore.getStudentAnswer(studentId, questionId)
    if (!question || !referenceAnswer || !studentAnswer) {
      handleError('Missing grading context', ErrorType.DATA_VALIDATION, 'reason_generation')
      updateFeedback('Required grading data is missing. Refresh the page and retry.')
      return
    }

    const messageId = Message.info('Generating explanation...', 0)
    try {
      const result = await withTimeout(
        (signal) =>
          generateReasonForHighlight({
            question,
            referenceAnswer,
            studentAnswer,
            highlightedText: text,
            highlightType: type,
            signal,
          }),
        REQUEST_TIMEOUT_MS,
      )
      if (!result.success || !result.reason)
        throw new Error(result.error || 'No reason was returned')

      const saved = saveAnnotation({
        text,
        type,
        reason: result.reason,
        studentId,
        questionId,
        matchedReferenceAnswer: result.matchedReferenceAnswer || '',
      })
      if (!saved) throw new Error('The generated reason could not be saved')

      updateFeedback(result.reason)
      Message.success('Explanation generated')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Reason generation failed'
      handleError(message, ErrorType.REASON_GENERATION, 'generate_reason')
      updateFeedback(`${message}. Please retry the annotation.`)
    } finally {
      Message.close(messageId)
    }
  }

  function saveReasonDirectly(
    text: string,
    type: HighlightType,
    reason: string,
    studentId: number,
    questionId: number,
    feedbackPanelRef?: ComponentRef<FeedbackPanelApi>,
  ): void {
    const existingItem = examStore
      .getHighlightData(studentId, questionId)
      ?.answer[type].find((item) => item['Student answer'] === text)

    if (
      saveAnnotation({
        text,
        type,
        reason,
        studentId,
        questionId,
        matchedReferenceAnswer: existingItem?.['matched reference answer'] || '',
      })
    ) {
      feedbackPanelRef?.value?.handleHighlightClicked({ text, type, reason })
    }
  }

  return {
    executeSingleGrading,
    executeBatchGrading,
    executeInitialGrading,
    generateReasonWithFeedback,
    saveReasonDirectly,
  }
}
