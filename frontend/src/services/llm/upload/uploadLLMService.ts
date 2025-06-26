// services/llm/upload/uploadLLMService.ts
import { API_CONFIG, isAPIConfigValid } from '@/config/api'
import { ElMessage } from 'element-plus'
import { UPLOAD_PROMPTS } from './uploadPrompts'

/**
 * 上传文件解析服务
 * 负责调用AI模型解析试卷和参考答案
 */
export class UploadLLMService {
  /**
   * 调用 OpenAI API
   */
  private async callOpenAI(prompt: string): Promise<string> {
    if (!isAPIConfigValid()) {
      throw new Error('API配置无效，请检查配置')
    }

    try {
      const response = await fetch(API_CONFIG.LLM.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${API_CONFIG.LLM.API_KEY}`,
        },
        body: JSON.stringify({
          model: API_CONFIG.LLM.UPLOAD.MODEL,
          messages: [{ role: 'user', content: prompt }],
          temperature: API_CONFIG.LLM.UPLOAD.TEMPERATURE,
          max_tokens: API_CONFIG.LLM.UPLOAD.MAX_TOKENS,
          stream: false,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`API调用失败: ${response.status} - ${errorText}`)
      }

      const result = await response.json()
      return result.choices[0].message.content
    } catch (error) {
      console.error('OpenAI API 调用失败:', error)
      throw error
    }
  }

  /**
   * 解析 JSON 响应
   * 处理AI返回的内容，提取JSON部分
   */
  private parseJSON(response: string): any {
    try {
      return JSON.parse(response)
    } catch (e) {
      // 尝试提取JSON部分
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
      throw new Error('模型返回格式错误')
    }
  }

  /**
   * 通用解析函数
   * @param content 文件内容
   * @param type 解析类型：'paper' 或 'answer'
   */
  async Parse(content: string, type: 'paper' | 'answer'): Promise<any> {
    try {
      // 根据类型选择提示信息
      const messageMap = {
        paper: '正在调用大模型分析试卷...',
        answer: '正在调用大模型解析参考答案...',
      }

      const successMap = {
        paper: '试卷解析成功',
        answer: '参考答案解析成功',
      }

      ElMessage.info(messageMap[type])

      // 根据类型选择对应的prompt
      const prompt =
        type === 'paper'
          ? UPLOAD_PROMPTS.PARSE_PAPER(content)
          : UPLOAD_PROMPTS.PARSE_ANSWER(content)

      // 调用API
      const response = await this.callOpenAI(prompt)
      const result = this.parseJSON(response)

      ElMessage.success(successMap[type])
      return result
    } catch (error) {
      console.error('模型解析失败:', error)
      ElMessage.error('模型解析失败: ' + (error as Error).message)
      throw error
    }
  }

  /**
   * 检查服务是否可用
   */
  isAvailable(): boolean {
    return isAPIConfigValid()
  }
}

// 创建并导出单例
export const uploadLLMService = new UploadLLMService()
