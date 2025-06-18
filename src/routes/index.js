import express from 'express';
import { healthCheck } from '../controllers/healthController.js';
import {  createQuestion } from '../controllers/question.js';

const router = express.Router();

// 헬스 체크 라우트
router.get('/health', healthCheck);

// 예시 라우트
router.post('/question', createQuestion);

export default router; 