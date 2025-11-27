import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  getSetting,
  getAllSettings,
  updateSetting
} from '../controllers/settingController.js';

const router = express.Router();

router.get('/', protect, authorize('admin'), getAllSettings);
router.get('/:key', protect, authorize('admin'), getSetting);
router.put('/:key', protect, authorize('admin'), updateSetting);

export default router;

