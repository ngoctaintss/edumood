import express from 'express';
import {
  getClassAnalytics,
  getAIAnalysis,
  getGlobalAnalytics,
  getStudentAIAnalysis
} from '../controllers/analyticsController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/class/:classId', protect, authorize('teacher', 'admin'), getClassAnalytics);
router.post('/ai', protect, authorize('teacher', 'admin'), getAIAnalysis);
router.get('/global', protect, authorize('admin'), getGlobalAnalytics);
router.post('/student/:studentId', protect, authorize('teacher', 'admin'), getStudentAIAnalysis);

export default router;
