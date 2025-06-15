<template>
  <div class="page-container">
    <el-card class="main-card">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <el-icon class="header-icon"><EditPen /></el-icon>
            <h3>Set the Prompt</h3>
          </div>
          <span class="status-badge">Current Configuration</span>
        </div>
      </template>

      <div class="content">
        <!-- 角色设置 -->
        <div class="section">
          <h4><el-icon><User /></el-icon>Grader Role</h4>
          <div class="display-box">{{ promptData.role }}</div>
        </div>

        <!-- 任务描述 -->
        <div class="section">
          <h4><el-icon><Document /></el-icon>Task Description</h4>
          <div class="display-box">{{ promptData.task_description }}</div>
        </div>

        <!-- 评分规则 -->
        <div class="section">
          <h4><el-icon><List /></el-icon>Scoring Rules</h4>
          <div class="rules-grid">
            <div class="rule-item rule-correct">
              <div class="rule-title">Correct Answer</div>
              <div class="display-box">{{ promptData.grading_rules['Correct Answers'] }}</div>
            </div>
            
            <div class="rule-item rule-wrong">
              <div class="rule-title">Wrong Answer</div>
              <div class="display-box">{{ promptData.grading_rules['Wrong Answers'] }}</div>
            </div>
            
            <div class="rule-item rule-unclear">
              <div class="rule-title">Unclear Answer</div>
              <div class="unclear-rules">
                <div v-for="(desc, type) in promptData.grading_rules['Unclear Answers']" :key="type" class="unclear-item">
                  <span class="unclear-type">{{ type }}:</span>
                  <div class="display-box">{{ desc }}</div>
                </div>
              </div>
            </div>
            
            <div class="rule-item rule-redundant">
              <div class="rule-title">Redundant Answer</div>
              <div class="display-box">{{ promptData.grading_rules['Redundant Answers'] }}</div>
            </div>
          </div>
        </div>

        <!-- 评分政策 -->
        <div class="section">
          <h4><el-icon><Trophy /></el-icon>Scoring Policy</h4>
          <div class="display-box">{{ promptData.scoring_policy }}</div>
        </div>

        <!-- 输出格式 -->
        <div class="section">
          <h4><el-icon><DocumentCopy /></el-icon>Output Format</h4>
          <div class="output-format">
            <div class="notes">
              <strong>Notes:</strong>
              <ul>
                <li v-for="note in promptData.output_format.notes" :key="note">{{ note }}</li>
              </ul>
            </div>
            <div class="structure">
              <strong>Output Structure:</strong>
              <pre class="json-code">{{ formatJsonStructure(promptData.output_format.structure) }}</pre>
            </div>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { Document, DocumentCopy, EditPen, List, Trophy, User } from '@element-plus/icons-vue'

// 静态导入 prompt 配置
import promptConfig from '@/config/prompt.json'

const promptData = promptConfig

// 格式化 JSON 结构显示
const formatJsonStructure = (structure: any) => {
  return JSON.stringify(structure, null, 2)
}
</script>

<style scoped>
.page-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
}

.main-card {
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  border: none;
}

.main-card:hover {
  transition: all 0.3s ease;
  transform: translateY(-4px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  margin: -20px -20px 0;
  border-radius: 12px 12px 0 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-icon {
  font-size: 20px;
}

.card-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.status-badge {
  background: rgba(255, 255, 255, 0.2);
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 12px;
  backdrop-filter: blur(10px);
}

.content {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.section {
  background: #f8fafc;
  border-radius: 8px;
  padding: 20px;
  border: 1px solid #e2e8f0;
}

.section h4 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 16px 0;
  color: #374151;
  font-size: 16px;
  font-weight: 600;
  border-bottom: 2px solid #e5e7eb;
  padding-bottom: 8px;
}

.section h4 .el-icon {
  color: #667eea;
}

.display-box {
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 16px;
  line-height: 1.6;
  color: #374151;
  font-size: 14px;
  white-space: pre-wrap;
}

.rules-grid {
  display: grid;
  gap: 16px;
}

.rule-item {
  border-left: 3px solid #667eea;
  padding-left: 16px;
}

/* 不同类型的边框颜色 */
.rule-correct {
  border-left-color: #10b981; /* 绿色 - 正确 */
}

.rule-wrong {
  border-left-color: #ef4444; /* 红色 - 错误 */
}

.rule-unclear {
  border-left-color: #f59e0b; /* 黄色 - 模糊 */
}

.rule-redundant {
  border-left-color: #3b82f6; /* 蓝色 - 冗余 */
}

.rule-title {
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
  font-size: 14px;
}

.unclear-rules {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.unclear-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.unclear-type {
  font-weight: 600;
  color: #f59e0b; /* 与模糊答案边框颜色保持一致 */
  font-size: 13px;
}

.output-format {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.notes, .structure {
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 16px;
}

.notes strong, .structure strong {
  color: #374151;
  display: block;
  margin-bottom: 8px;
}

.notes ul {
  margin: 0;
  padding-left: 20px;
  color: #4b5563;
}

.notes li {
  margin-bottom: 4px;
}

.json-code {
  background: #1f2937;
  color: #e5e7eb;
  padding: 16px;
  border-radius: 6px;
  font-family: 'Monaco', 'Consolas', monospace;
  font-size: 12px;
  line-height: 1.4;
  overflow-x: auto;
  margin: 0;
}

/* 响应式 */
@media (max-width: 768px) {
  .page-container {
    padding: 16px;
  }
  
  .content {
    padding: 16px;
  }
  
  .card-header {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }
}
</style>