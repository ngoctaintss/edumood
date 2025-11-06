import express from 'express';
import {
  getStudentsByClass,
  createStudent,
  updateStudent,
  deleteStudent
} from '../controllers/studentController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/class/:classId', protect, authorize('teacher', 'admin'), getStudentsByClass);
router.post('/', protect, authorize('teacher', 'admin'), createStudent);
router.put('/:id', protect, authorize('teacher', 'admin'), updateStudent);
router.delete('/:id', protect, authorize('teacher', 'admin'), deleteStudent);

export default router;
