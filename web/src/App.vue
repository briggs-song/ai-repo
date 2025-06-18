<template>
  <div class="container">
    <h1>AI 질문하기</h1>
    <div class="question-form">
      <div class="input-group">
        <label for="system-instruction">시스템 지시사항</label>
        <textarea
          id="system-instruction"
          v-model="systemInstruction"
          placeholder="AI에게 전달할 시스템 지시사항을 입력하세요..."
          rows="3"
          class="system-input"
        ></textarea>
      </div>
      <div class="input-group">
        <label for="question">질문</label>
        <textarea
          id="question"
          v-model="question"
          placeholder="질문을 입력하세요..."
          rows="4"
          class="question-input"
        ></textarea>
      </div>
      <button @click="submitQuestion" :disabled="isLoading" class="submit-btn">
        {{ isLoading ? '처리 중...' : '질문하기' }}
      </button>
    </div>
    
    <div v-if="response" class="response-container">
      <h2>AI 응답</h2>
      <div class="response-content">
        {{ response }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import axios from 'axios'

const question = ref('')
const systemInstruction = ref('You are a helpful assistant that can answer questions and help with tasks.')
const response = ref('')
const isLoading = ref(false)

const submitQuestion = async () => {
  if (!question.value.trim()) {
    alert('질문을 입력해주세요.')
    return
  }

  if (!systemInstruction.value.trim()) {
    alert('시스템 지시사항을 입력해주세요.')
    return
  }

  isLoading.value = true
  try {
    const result = await axios.post('http://localhost:3000/api/question', {
      prompt: question.value,
      systemInstruction: systemInstruction.value
    })
    
    response.value = result.data.data.response

  } catch (error) {
    console.error('Error:', error)
    alert('질문 처리 중 오류가 발생했습니다.')
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

h1 {
  text-align: center;
  color: #2c3e50;
  margin-bottom: 2rem;
}

.question-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.input-group label {
  font-weight: 600;
  color: #2c3e50;
}

.system-input,
.question-input {
  width: 100%;
  padding: 1rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  resize: vertical;
}

.system-input {
  background-color: #f8f9fa;
}

.submit-btn {
  padding: 1rem 2rem;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s;
}

.submit-btn:hover {
  background-color: #45a049;
}

.submit-btn:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.response-container {
  background-color: #f8f9fa;
  padding: 1.5rem;
  border-radius: 8px;
  margin-top: 2rem;
}

.response-container h2 {
  color: #2c3e50;
  margin-bottom: 1rem;
}

.response-content {
  white-space: pre-wrap;
  line-height: 1.6;
}
</style> 