# 试卷管理说明

## 目录结构

```
paper/
├── paper.json       					# 题目信息（支持多个题目）
├── answer.json      					# 参考答案（对应多个题目）
├── student_answer.json				# 学生试卷
└── README.md          			  # 说明文档
```

## 文件格式

### paper.json - 支持多个题目

可以包含单个题目或多个题目的数组：

**多个题目格式（推荐）：**

```json
[
  {
    "question_id": "q1",
    "question": "第一题内容",
    "score": 8
  },
  {
    "question_id": "q2",
    "question": "第二题内容",
    "score": 10
  }
]
```

**单个题目格式：**

```json
{
  "question_id": "q1",
  "question": "题目内容",
  "score": 8
}
```

### answer.json - 对应的参考答案

格式需要与 paper.json 保持一致：

**多个答案格式：**

```json
[
  {
    "question_id": "q1",
    "answer": "第一题的参考答案"
  },
  {
    "question_id": "q2",
    "answer": "第二题的参考答案"
  }
]
```

**单个答案格式：**

```json
{
  "question_id": "q1",
  "answer": "参考答案内容"
}
```

### student_answer.json - 对应的学生试卷

**多个答案格式：**

```json
{
  "student_id": 1,
  "question_id": 1,
  "answer": ""
},
{
  "student_id": 1,
  "question_id": 2,
  "answer": ""
},
{
  "student_id": 2,
  "question_id": 1,
  "answer": ""
},
...
```

**单个答案格式：**

```json
{
  "student_id": 1,
  "question_id": 1,
  "answer": ""
},
{
  "student_id": 2,
  "question_id": 1,
  "answer": ""
},
...
```

### 

## 添加流程

### 1. 创建 paper.json 文件

在试卷目录中创建包含多个题目的 `paper.json` 文件

### 2. 创建 answer.json 文件

在试卷目录中创建对应的 `answer.json` 文件

### 3. 创建 student_answer.json 文件

在试卷目录中创建对应的 `student_answer.json` 文件

## 添加新题目到现有试卷

### 1. 编辑 paper.json

在现有的题目数组中添加新题目：

```json
[
  // ... 现有题目 ...
  {
    "question_id": "q3",
    "question": "新题目内容",
    "score": 12
  }
]
```

### 2. 编辑 answer.json

添加对应的参考答案：

```json
[
  // ... 现有答案 ...
  {
    "question_id": "q3",
    "answer": "新题目的参考答案"
  }
]
```

## 字段说明

### paper.json

- `question_id`: 题目唯一标识符（在同一试卷内唯一）
- `question`: 题目内容
- `score`: 题目分值

### answer.json

- `question_id`: 对应的题目标识符
- `answer`: 参考答案内容

### Student_answer.json

- `student_id`: 对应的学生标识符

- `question_id`: 对应的题目标识符

- `answer`: 学生作答内容

  
