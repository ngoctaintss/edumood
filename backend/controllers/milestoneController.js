import Milestone from '../models/Milestone.js';

// @desc    Get all milestones (for students - only active ones)
// @route   GET /api/milestones
// @access  Private (Student/Teacher/Admin)
export const getMilestones = async (req, res) => {
  try {
    const query = {};
    
    // Students only see active milestones
    if (req.user.role === 'student') {
      query.isActive = true;
    }

    const milestones = await Milestone.find(query)
      .sort({ order: 1, dayCount: 1 });

    res.json(milestones);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// @desc    Get single milestone
// @route   GET /api/milestones/:id
// @access  Private (Admin)
export const getMilestone = async (req, res) => {
  try {
    const milestone = await Milestone.findById(req.params.id);

    if (!milestone) {
      return res.status(404).json({ message: 'Không tìm thấy milestone' });
    }

    res.json(milestone);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// @desc    Create milestone
// @route   POST /api/milestones
// @access  Private (Admin)
export const createMilestone = async (req, res) => {
  try {
    const { name, description, dayCount, rewardPoints, rewardMessage, icon, color, order } = req.body;

    if (!name || !dayCount) {
      return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin' });
    }

    // Check if milestone with same dayCount already exists
    const existing = await Milestone.findOne({ dayCount });
    if (existing) {
      return res.status(400).json({ message: `Đã có milestone cho ${dayCount} ngày` });
    }

    const milestone = await Milestone.create({
      name,
      description: description || '',
      dayCount,
      rewardPoints: rewardPoints || 0,
      rewardMessage: rewardMessage || '',
      icon: icon || '🏆',
      color: color || '#FFD700',
      order: order || dayCount,
      isActive: true
    });

    res.status(201).json(milestone);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// @desc    Update milestone
// @route   PUT /api/milestones/:id
// @access  Private (Admin)
export const updateMilestone = async (req, res) => {
  try {
    const { name, description, dayCount, rewardPoints, rewardMessage, icon, color, isActive, order } = req.body;

    const milestone = await Milestone.findById(req.params.id);

    if (!milestone) {
      return res.status(404).json({ message: 'Không tìm thấy milestone' });
    }

    // If dayCount is being changed, check for conflicts
    if (dayCount && dayCount !== milestone.dayCount) {
      const existing = await Milestone.findOne({ dayCount, _id: { $ne: req.params.id } });
      if (existing) {
        return res.status(400).json({ message: `Đã có milestone cho ${dayCount} ngày` });
      }
    }

    milestone.name = name || milestone.name;
    milestone.description = description !== undefined ? description : milestone.description;
    milestone.dayCount = dayCount || milestone.dayCount;
    milestone.rewardPoints = rewardPoints !== undefined ? rewardPoints : milestone.rewardPoints;
    milestone.rewardMessage = rewardMessage !== undefined ? rewardMessage : milestone.rewardMessage;
    milestone.icon = icon || milestone.icon;
    milestone.color = color || milestone.color;
    milestone.isActive = isActive !== undefined ? isActive : milestone.isActive;
    milestone.order = order !== undefined ? order : milestone.order;

    await milestone.save();

    res.json(milestone);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// @desc    Delete milestone
// @route   DELETE /api/milestones/:id
// @access  Private (Admin)
export const deleteMilestone = async (req, res) => {
  try {
    const milestone = await Milestone.findById(req.params.id);

    if (!milestone) {
      return res.status(404).json({ message: 'Không tìm thấy milestone' });
    }

    await milestone.deleteOne();

    res.json({ message: 'Xóa milestone thành công' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

