import express from 'express';
import {
  getAllClasses,
  getClassById,
  createClass,
  updateClass,
  deleteClass,
  assignTeacher
} from '../controllers/classController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, authorize('admin', 'teacher'), getAllClasses);
router.get('/:id', protect, authorize('admin', 'teacher'), getClassById);
router.post('/', protect, authorize('admin'), createClass);
router.put('/:id', protect, authorize('admin'), updateClass);
router.delete('/:id', protect, authorize('admin'), deleteClass);
router.put('/:id/assign-teacher', protect, authorize('admin'), assignTeacher);

export default router;
