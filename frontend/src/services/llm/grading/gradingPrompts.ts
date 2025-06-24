/**
 * 给分相关提示词模板和构建器
 */
import type { Question, ReferenceAnswer, StudentAnswer } from '../../../stores/useExamDataStore'

/**
 * 加载静态提示词模板
 */
export async function loadStaticPromptTemplate(): Promise<any> {
  try {
    // 尝试直接导入开发环境
    try {
      const promptModule = await import('../../../config/prompt.json')
      return promptModule.default || promptModule
    } catch (importError) {
      // 生产环境回退到fetch
      const response = await fetch('/src/config/prompt.json')
      if (!response.ok) {
        throw new Error(`Failed to load prompt.json: ${response.status}`)
      }
      return await response.json()
    }
  } catch (error) {
    console.error('加载静态提示词模板失败:', error)
    throw new Error('Failed to load static prompt template')
  }
}

/**
 * 构建初始给分提示词
 * 1. Role
 * 2. Task Description
 * 3. Question
 * 4. Reference Answer
 * 5. Grading Rules
 * 6. Output Format
 * 7. Student Answer
 */
export function buildGradingPrompt(
  question: Question,
  referenceAnswer: ReferenceAnswer,
  studentAnswer: StudentAnswer,
  staticPrompt: any,
): string {
  return `${staticPrompt.role}

${staticPrompt.task_description}

QUESTION:
${question.question}

REFERENCE ANSWER:
${referenceAnswer.answer}

GRADING RULES:
${JSON.stringify(staticPrompt.grading_rules, null, 2)}

SCORING POLICY:
${staticPrompt.scoring_policy}

OUTPUT FORMAT:
${JSON.stringify(staticPrompt.output_format.structure, null, 2)}

STUDENT ANSWER:
${studentAnswer.answer}
Maximum score for this question: ${question.score}

IMPORTANT: Replace the null values in the output format with:
- student_id: ${studentAnswer.student_id}
- question_id: ${question.question_id}
- Student answer: The student's answer text must be written completely in accordance with the student's original response, retaining all original formats, including the number of spaces, line breaks, etc., without adding extra text, rewriting, or rephrasing.
- Scoring Point: actual matched the scoring point from the reference answer(must be a number). If a student's answer matches multiple scoring points, break it down and write it separately, with each scoring point being only one digit.
- total_score: actual calculated score (must be a number)
Please evaluate the student answer and return the JSON response according to the format above.`
}

/**
 * 构建提示词，根据老师的高亮修改生成给分原因
 */
export function buildReasonGenerationPrompt(
  question: Question,
  referenceAnswer: ReferenceAnswer,
  studentAnswer: StudentAnswer,
  highlightedText: string,
  highlightType: 'correct' | 'wrong' | 'unclear' | 'redundant',
  staticPrompt?: any,
): string {
  const typeDescriptions = {
    correct: 'correctly matches a scoring point',
    wrong: 'is incorrect or contradicts the reference answer',
    unclear: 'is partially correct or unclear',
    redundant: 'is correct but irrelevant to the question',
  }

  return `${staticPrompt?.role || 'You are a university computer science instructor providing detailed feedback on student answers.'}

TASK: Generate a detailed scoring reason for the highlighted text segment.

QUESTION: ${question.question}

REFERENCE ANSWER: ${referenceAnswer.answer}

STUDENT ANSWER: ${studentAnswer.answer}

HIGHLIGHTED TEXT: "${highlightedText}"

CLASSIFICATION: ${highlightType} (${typeDescriptions[highlightType]})

Please provide a clear and specific reason explaining why this text segment is classified as "${highlightType}".

The reason should:
1. Reference specific aspects of the reference answer when applicable
2. Explain the scoring decision clearly
3. Be concise but comprehensive
4. Use educational language appropriate for student feedback

Return only the reason text, no additional formatting or labels.`
}

/**
 * 特定给分场景的提示词模板
 */
export const GRADING_PROMPTS = {
  /**
   * 标准单个学生给分
   */
  SINGLE_STUDENT_GRADING: buildGradingPrompt,

  /**
   * 生成老师修改高亮的原因
   */
  HIGHLIGHT_REASON_GENERATION: buildReasonGenerationPrompt,
}

/**
 * 根据上下文获取适当的提示词构建器
 */
export function getPromptBuilder(context: 'initial' | 'reason') {
  switch (context) {
    case 'initial':
      return GRADING_PROMPTS.SINGLE_STUDENT_GRADING
    case 'reason':
      return GRADING_PROMPTS.HIGHLIGHT_REASON_GENERATION
    default:
      return GRADING_PROMPTS.SINGLE_STUDENT_GRADING
  }
}
