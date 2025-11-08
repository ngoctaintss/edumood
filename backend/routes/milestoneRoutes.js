import express from 'express';
import {
  getMilestones,
  getMilestone,
  createMilestone,
  updateMilestone,
  deleteMilestone
} from '../controllers/milestoneController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// All users can view milestones (students see only active ones)
router.get('/', protect, getMilestones);

// Admin only routes
router.get('/:id', protect, authorize('admin'), getMilestone);
router.post('/', protect, authorize('admin'), createMilestone);
router.put('/:id', protect, authorize('admin'), updateMilestone);
router.delete('/:id', protect, authorize('admin'), deleteMilestone);

export default router;

