// API配置
export const API_CONFIG = {
  // LLM API 配置
  LLM: {
    API_KEY: import.meta.env.VITE_API_KEY,
    API_URL: import.meta.env.VITE_API_URL,

    // 文件上传配置
    UPLOAD: {
      MODEL: 'gpt-4o-all',
      MAX_TOKENS: 16384,
      TEMPERATURE: 0.1,

      MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
      ALLOWED_TYPES: ['.txt', '.doc', '.docx', '.json'],
      TIMEOUT: 30000, // 30秒
    },

    //  批改配置
    GRADING: {
      MODEL: 'o3-mini',
      MAX_TOKENS: 4096,
      TEMPERATURE: 0.3,
    },

    // 理由生成配置
    REASON_GENERATION: {
      MODEL: 'o3-mini',
      MAX_TOKENS: 150,
      TEMPERATURE: 0.3,
    },
  },
}

// 检查API配置
export function isAPIConfigValid() {
  return API_CONFIG.LLM.API_KEY && API_CONFIG.LLM.API_KEY !== 'your-api-key-here'
}

// 环境信息
export function getEnvironmentInfo() {
  return {
    isDevelopment: import.meta.env.DEV,
    isProduction: import.meta.env.PROD,
    apiKeyConfigured: isAPIConfigValid(),
  }
}
