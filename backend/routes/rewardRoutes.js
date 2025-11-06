import express from 'express';
import {
  getAllRewards,
  createReward,
  updateReward,
  deleteReward,
  redeemReward,
  getStudentRedemptions,
  getPendingRedemptions,
  updateRedemptionStatus
} from '../controllers/rewardController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, getAllRewards);
router.post('/', protect, authorize('admin'), createReward);
router.put('/:id', protect, authorize('admin'), updateReward);
router.delete('/:id', protect, authorize('admin'), deleteReward);
router.post('/redeem', protect, authorize('student'), redeemReward);
router.get('/redemptions/student/:studentId', protect, getStudentRedemptions);
router.get('/redemptions/pending', protect, authorize('teacher'), getPendingRedemptions);
router.put('/redemptions/:id', protect, authorize('teacher'), updateRedemptionStatus);

export default router;
