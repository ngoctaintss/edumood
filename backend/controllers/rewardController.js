import Reward from '../models/Reward.js';
import RewardRedemption from '../models/RewardRedemption.js';
import Student from '../models/Student.js';

// @desc    Get all rewards
// @route   GET /api/rewards
// @access  Private
export const getAllRewards = async (req, res) => {
  try {
    const rewards = await Reward.find({ isActive: true });
    res.json(rewards);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create a reward
// @route   POST /api/rewards
// @access  Private (Admin)
export const createReward = async (req, res) => {
  try {
    const { name, cost, imageUrl, description } = req.body;

    if (!name || !cost) {
      return res.status(400).json({ message: 'Please provide name and cost' });
    }

    const reward = await Reward.create({
      name,
      cost,
      imageUrl: imageUrl || '',
      description: description || ''
    });

    res.status(201).json(reward);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update a reward
// @route   PUT /api/rewards/:id
// @access  Private (Admin)
export const updateReward = async (req, res) => {
  try {
    const { name, cost, imageUrl, description, isActive } = req.body;

    const reward = await Reward.findById(req.params.id);

    if (!reward) {
      return res.status(404).json({ message: 'Reward not found' });
    }

    if (name) reward.name = name;
    if (cost !== undefined) reward.cost = cost;
    if (imageUrl !== undefined) reward.imageUrl = imageUrl;
    if (description !== undefined) reward.description = description;
    if (isActive !== undefined) reward.isActive = isActive;

    await reward.save();

    res.json(reward);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete a reward
// @route   DELETE /api/rewards/:id
// @access  Private (Admin)
export const deleteReward = async (req, res) => {
  try {
    const reward = await Reward.findById(req.params.id);

    if (!reward) {
      return res.status(404).json({ message: 'Reward not found' });
    }

    await Reward.findByIdAndDelete(req.params.id);

    res.json({ message: 'Reward deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Redeem a reward
// @route   POST /api/rewards/redeem
// @access  Private (Student)
export const redeemReward = async (req, res) => {
  try {
    const { rewardId } = req.body;

    const reward = await Reward.findById(rewardId);

    if (!reward) {
      return res.status(404).json({ message: 'Reward not found' });
    }

    const student = await Student.findById(req.user._id);

    if (student.points < reward.cost) {
      return res.status(400).json({ 
        message: `Not enough points. You need ${reward.cost} points but have ${student.points}.` 
      });
    }

    // Deduct points
    student.points -= reward.cost;
    await student.save();

    // Create redemption record
    const redemption = await RewardRedemption.create({
      studentId: student._id,
      rewardId: reward._id,
      rewardName: reward.name,
      pointsSpent: reward.cost,
      status: 'pending'
    });

    res.json({
      message: 'Reward redeemed successfully! Your teacher will approve it soon.',
      redemption,
      remainingPoints: student.points
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get student's redemptions
// @route   GET /api/rewards/redemptions/student/:studentId
// @access  Private (Student/Teacher)
export const getStudentRedemptions = async (req, res) => {
  try {
    const { studentId } = req.params;

    const redemptions = await RewardRedemption.find({ studentId })
      .populate('rewardId', 'name imageUrl')
      .sort({ createdAt: -1 });

    res.json(redemptions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all pending redemptions for teacher's classes
// @route   GET /api/rewards/redemptions/pending
// @access  Private (Teacher)
export const getPendingRedemptions = async (req, res) => {
  try {
    // Get all students in teacher's classes
    const students = await Student.find({ 
      classId: { $in: req.user.classIds } 
    }).select('_id');

    const studentIds = students.map(s => s._id);

    const redemptions = await RewardRedemption.find({
      studentId: { $in: studentIds },
      status: 'pending'
    })
      .populate('studentId', 'name studentId classId')
      .populate('rewardId', 'name imageUrl')
      .sort({ createdAt: -1 });

    res.json(redemptions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update redemption status
// @route   PUT /api/rewards/redemptions/:id
// @access  Private (Teacher)
export const updateRedemptionStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const redemption = await RewardRedemption.findById(req.params.id);

    if (!redemption) {
      return res.status(404).json({ message: 'Redemption not found' });
    }

    redemption.status = status;
    await redemption.save();

    res.json(redemption);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
