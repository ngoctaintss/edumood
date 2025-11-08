import express from 'express';
import { getStreak } from '../controllers/streakController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, authorize('student'), getStreak);

export default router;

