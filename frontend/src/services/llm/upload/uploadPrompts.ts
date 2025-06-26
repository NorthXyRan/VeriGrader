// services/llm/upload/uploadPrompts.ts

/**
 * 上传解析相关的Prompt模板
 */
export const UPLOAD_PROMPTS = {
  /**
   * 试卷解析 Prompt
   */
  PARSE_PAPER: (content: string) => `
请首先检查上传的文件是否是试卷，如果你发现上传的不是试卷，请你返回原始文本。如果是试卷，
请分析以下试卷内容，并返回一个JSON格式的结果，包含题目数量和题目内容：

试卷内容：
${content}

请按照以下格式返回JSON:
{
  "questionCount": 题目总数,
  "questions": [
    {
      "question_id": 题号,number类型
      "question": "题目内容",
      "score": 分值
    }
  ]
}

重要：只返回JSON数据，不要任何额外的文字说明。请严格按照上传的文件的排版格式，在合适的地方添加换行符。`,

  /**
   * 参考答案解析 Prompt
   */
  PARSE_ANSWER: (content: string) => `
请分析以下参考答案内容，并返回一个JSON格式的结果：

参考答案内容：
${content}

请按照以下格式返回JSON:
{
  "answerCount": 答案总数,
  "answers": [
    {
      "question_id": 题号,number类型
      "answer": "参考答案内容"
    }
  ]
}

重要：只返回JSON数据，不要任何额外的文字说明。请严格按照上传的文件的排版格式，在合适的地方添加换行符。`,
}
