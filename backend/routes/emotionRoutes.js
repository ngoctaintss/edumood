import express from 'express';
import {
  submitEmotion,
  getEmotionsByClass,
  checkTodaySubmission,
  getStudentEmotions
} from '../controllers/emotionController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.post('/', protect, authorize('student'), submitEmotion);
router.get('/class/:classId', protect, authorize('teacher', 'admin'), getEmotionsByClass);
router.get('/check/:studentId', protect, checkTodaySubmission);
router.get('/student/:studentId', protect, getStudentEmotions);

export default router;
