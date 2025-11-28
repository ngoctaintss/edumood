import express from 'express';
import {
  submitEmotion,
  getEmotionsByClass,
  checkTodaySubmission,
  checkClassSubmissions,
  getStudentEmotions,
  getStudentEmotions7Days,
  getEncouragement
} from '../controllers/emotionController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.post('/', protect, authorize('student'), submitEmotion);
router.post('/encouragement', protect, authorize('student'), getEncouragement);
router.get('/class/:classId', protect, authorize('teacher', 'admin'), getEmotionsByClass);
router.get('/check/:studentId', protect, checkTodaySubmission);
router.get('/check-class/:classId', protect, authorize('teacher', 'admin'), checkClassSubmissions);
router.get('/student/:studentId/7days', protect, authorize('student', 'teacher', 'admin'), getStudentEmotions7Days);
router.get('/student/:studentId', protect, getStudentEmotions);

export default router;
