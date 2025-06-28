# Upload组件架构文档

## 概述

Upload组件负责处理试卷、参考答案和学生答案的文件上传、解析和管理。采用配置化设计模式，统一了处理流程，并集成了统一的日志系统。

## 核心设计原则

1. **配置化驱动**: 使用配置对象减少重复代码，统一处理逻辑
2. **单向数据流**: 用户操作 → 父组件处理 → Store更新 → 子组件响应  
3. **单一数据源**: Store是唯一的状态来源，子组件完全无状态
4. **双Store架构**: 上传状态与业务数据分离管理
5. **统一日志**: 使用logger系统进行结构化日志记录

## 组件结构

```
src/components/upload/
├── Uploading.vue              # 主容器组件 (核心业务逻辑)
├── BaseUpload.vue             # 基础上传组件 (通用UI)
├── PaperUpload.vue            # 试卷上传组件 (事件转发)
├── AnswerUpload.vue           # 参考答案上传组件 (事件转发)
├── StudentUpload.vue          # 学生答案上传组件 (事件转发)
└── Preview.vue                # 预览弹窗组件 (内容展示)
```

## 核心架构

### 1. 类型定义与配置

```typescript
type FileType = 'paper' | 'answer' | 'student'

interface FileTypeConfig {
  displayName: string
  setUploading: (fileName: string, content: string) => void
  setReady: (data: any, meta: any) => void
  setError: (error: string) => void
  updateStore: (data: any) => { count: number; message: string }
}

// 配置映射 - 消除重复代码
const fileTypeConfigs: Record<FileType, FileTypeConfig> = {
  paper: { /* 试卷配置 */ },
  answer: { /* 答案配置 */ },
  student: { /* 学生配置 */ }
}
```

### 2. 统一处理函数

```typescript
const processFile = async (file: File, type: FileType) => {
  const config = fileTypeConfigs[type]
  
  logger.group('文件处理', `${config.displayName}: ${file.name}`)
  
  try {
    // 1. 读取文件内容
    logger.info('读取文件内容', { 文件名: file.name, 文件大小: `${file.size} bytes` })
    const content = await readFileContent(file)
    
    // 2. 设置上传状态
    config.setUploading(file.name, content)
    
    // 3. 解析数据 (JSON直解析 / AI解析)
    let parsedData = await parseFileContent(content, file.name, type)
    
    // 4. 更新数据和状态
    const { count, message } = config.updateStore(parsedData)
    config.setReady(parsedData, buildMeta(type, count, parsedData))
    
    // 5. 保存并反馈
    saveToLocal()
    ElMessage.success(message)
    logger.success('数据更新完成', { 解析数量: count })
    
  } catch (error) {
    handleError(config, error, file.name)
  } finally {
    logger.groupEnd()
  }
}
```

### 3. 配置化事件处理

```typescript
// 统一的文件选择处理
const handleFileSelected = (file: File, type: FileType) => {
  logger.info('文件选择', { 类型: fileTypeConfigs[type].displayName, 文件名: file.name })
  processFile(file, type)
}

// 配置化的移除操作
const removeConfigs: Record<FileType, RemoveConfig> = {
  paper: { displayName: 'Paper', resetUpload: () => uploadStore.resetPaper(), ... },
  answer: { displayName: 'Reference answer', resetUpload: () => uploadStore.resetAnswer(), ... },
  student: { displayName: 'Student answer', resetUpload: () => uploadStore.resetStudent(), ... }
}

const handleRemove = (type: FileType) => {
  const config = removeConfigs[type]
  logger.info('移除文件', { 类型: config.displayName })
  
  config.resetUpload()
  config.resetExam()
  saveToLocal()
  
  ElMessage.success(`${config.displayName} removed successfully`)
}
```

## 状态管理

### useUploadStatusStore (上传状态管理)

```typescript
interface UploadItem {
  name: string                 // 文件名
  status: 'idle' | 'uploading' | 'processing' | 'ready' | 'error'
  rawContent: string          // 原始文件内容 (用于预览)
  parsedData?: any           // 解析后的JSON数据
  error?: string             // 错误信息
  meta?: any                 // 元数据 (题目数量等)
}

// Store状态
const examPaper: Ref<UploadItem>
const referenceAnswer: Ref<UploadItem>
const studentAnswers: Ref<UploadItem>

// 计算属性
const canUploadAnswer: boolean     // 是否可以上传参考答案
const canUploadStudent: boolean    // 是否可以上传学生答案
const canProceedToGrading: boolean // 是否可以进入评分页面
```

### useExamDataStore (业务数据管理)

```typescript
const questions: Ref<Question[]>           // 试卷题目
const referenceAnswers: Ref<Answer[]>      // 参考答案
const studentAnswers: Ref<StudentAnswer[]> // 学生答案
```

## 日志系统

### 使用logger进行结构化日志

```typescript
import { logger } from '../../utils/logger'

// 分组日志
logger.group('文件处理', `${config.displayName}: ${file.name}`)
logger.groupEnd()

// 不同级别的日志
logger.info('读取文件内容', { 文件名: file.name, 文件大小: `${file.size} bytes` })
logger.success('数据更新完成', { 解析数量: count })
logger.error('文件处理失败', { 错误: errorMessage, 文件: file.name })
logger.saved('数据已保存到本地存储')
```

### 日志分类

- **info**: 一般信息记录
- **success**: 成功操作记录  
- **error**: 错误信息记录
- **saved**: 数据保存记录
- **group/groupEnd**: 分组日志，便于调试追踪

## 组件职责

### Uploading.vue (主容器组件)

**职责**: 统一的业务逻辑处理中心

**核心功能**:
- 配置化文件处理 (`processFile`)
- 统一事件处理 (`handleFileSelected`, `handleRemove`, `handlePreview`)
- 重置操作 (`resetAll`)
- 组件初始化和数据恢复

**关键特性**:
- 配置驱动，减少重复代码
- 统一的错误处理机制
- 结构化日志记录
- 响应式状态管理

### BaseUpload.vue (基础上传组件)

**职责**: 通用的上传UI组件，完全无状态

**核心功能**:
- 文件拖拽上传界面
- 状态指示器 (上传中、成功、错误)
- 文件操作按钮 (移除、预览)
- 响应式设计

**设计原则**: 纯UI组件，不包含任何业务逻辑

### PaperUpload/AnswerUpload/StudentUpload (特化组件)

**职责**: 特定类型的上传组件，负责事件转发

**核心功能**: 
- 接收父组件状态props
- 转发用户操作事件
- 提供特定样式定制

### Preview.vue (预览组件)

**职责**: 统一的文件内容预览

**核心功能**:
- 显示原始文件内容
- 支持复制到剪贴板
- 响应式弹窗布局
- 统一的预览体验

## 数据流

```
用户操作 → 子组件事件 → 父组件处理 → Store更新 → UI自动响应

1. 用户选择文件 → PaperUpload.emit('file-selected')
2. Uploading接收事件 → handleFileSelected()
3. 执行processFile() → 读取、解析、验证
4. 更新Store状态 → uploadStore.setPaperReady()
5. 计算属性更新 → paperDisplayText
6. 子组件props更新 → UI自动刷新
```

## 错误处理

### 统一错误处理流程

```typescript
try {
  // 文件处理逻辑
} catch (error) {
  const errorMessage = error.message || '未知错误'
  logger.error(`${config.displayName}处理失败`, { 错误: errorMessage, 文件: file.name })
  
  config.setError(errorMessage)
  ElMessage.error(`${config.displayName} processing failed: ${errorMessage}`)
  uploadStore.saveToLocal()
}
```

### 错误类型

- **文件读取失败**: 文件内容为空或格式不支持
- **AI解析失败**: LLM服务不可用或解析超时
- **数据验证失败**: JSON格式不符合预期结构
- **网络错误**: 上传或API调用失败

## 性能优化

### 配置化设计优势

1. **代码复用**: 三种文件类型共享相同的处理逻辑
2. **维护性**: 修改处理流程只需更新配置和核心函数
3. **可扩展性**: 添加新文件类型只需增加配置项
4. **类型安全**: TypeScript接口确保配置完整性

### 响应式优化

- 使用computed属性避免不必要的重计算
- 组件懒加载和按需渲染
- 本地存储缓存，避免重复处理

## 调试指南

### 1. 状态追踪

```javascript
// 浏览器控制台查看Store状态
console.log('Upload状态:', uploadStore.$state)
console.log('Exam数据:', examStore.$state)
```

### 2. 日志追踪

开发环境下，所有操作都有详细的分组日志：

```
[文件处理] Paper: exam.txt
  INFO: 读取文件内容 {文件名: "exam.txt", 文件大小: "1024 bytes"}
  INFO: 检测到非JSON文件，使用AI解析
  SUCCESS: 数据解析成功 {数据类型: "object"}
  SUCCESS: 数据更新完成 {解析数量: 5}
  SAVED: 数据已保存到本地存储
```

### 3. 配置检查

```typescript
// 检查配置完整性
Object.keys(fileTypeConfigs).forEach(type => {
  const config = fileTypeConfigs[type]
  console.log(`${type} 配置:`, config)
})
```

## 注意事项

### 1. 文件格式要求

- **试卷**: 支持TXT, DOC, DOCX, JSON
- **参考答案**: 支持TXT, DOC, DOCX, JSON  
- **学生答案**: 仅支持JSON格式

### 2. 数据依赖关系

- 参考答案上传需要先上传试卷
- 学生答案上传需要先上传试卷
- 参考答案是可选的

### 3. 配置更新指南

当需要修改处理逻辑时：

1. 更新对应的`FileTypeConfig`配置
2. 如需添加新的处理步骤，在`processFile`中统一添加
3. 确保错误处理覆盖新的失败场景
4. 更新相关的TypeScript接口定义

### 4. 性能考虑

- 大文件上传可能造成界面卡顿
- AI解析可能需要较长时间
- localStorage有大小限制 (~5MB)
- 建议对大文件进行分块处理或压缩