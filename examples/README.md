# Example data

This directory contains a small, fully synthetic dataset that can be uploaded directly to VeriGrader. Upload the files in this order:

1. `paper.json`
2. `reference_answers.json`
3. `student_answers.json`

The three files are linked by a positive integer `question_id`. Every reference-answer file must contain exactly one entry for every question, and every student must have exactly one response for every question.

## Paper format

```json
{
  "questions": [
    {
      "question_id": 1,
      "question": "Question text",
      "score": 4
    }
  ]
}
```

- `question_id`: unique positive integer
- `question`: non-empty question text
- `score`: positive maximum score

## Reference-answer format

```json
{
  "answers": [
    {
      "question_id": 1,
      "answer": "Reference answer with the expected scoring points.",
      "eachScoringPoint": 2
    }
  ]
}
```

- `question_id`: identifier of the corresponding question
- `answer`: non-empty reference answer
- `eachScoringPoint`: optional positive score for each scoring point

## Student-answer format

```json
[
  {
    "student_id": 1,
    "question_id": 1,
    "answer": "Student response"
  }
]
```

- `student_id`: positive integer identifying a student
- `question_id`: identifier of the corresponding question
- `answer`: response text; an empty string is allowed

The example content is fictional and is not derived from the study dataset.
