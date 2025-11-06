import express from 'express';
import {
  getAllTeachers,
  getTeacherById,
  createTeacher,
  updateTeacher,
  deleteTeacher,
  getTeacherClasses
} from '../controllers/teacherController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, authorize('admin'), getAllTeachers);
router.get('/:id', protect, authorize('admin', 'teacher'), getTeacherById);
router.post('/', protect, authorize('admin'), createTeacher);
router.put('/:id', protect, authorize('admin'), updateTeacher);
router.delete('/:id', protect, authorize('admin'), deleteTeacher);
router.get('/:id/classes', protect, authorize('admin', 'teacher'), getTeacherClasses);

export default router;
