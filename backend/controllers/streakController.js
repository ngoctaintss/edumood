import Streak from '../models/Streak.js';
import Student from '../models/Student.js';

// @desc    Get student's streak information
// @route   GET /api/streak
// @access  Private (Student)
export const getStreak = async (req, res) => {
  try {
    let streak = await Streak.findOne({ studentId: req.user._id })
      .populate('milestonesAchieved.milestoneId');

    if (!streak) {
      // Create initial streak if doesn't exist
      streak = await Streak.create({
        studentId: req.user._id,
        currentStreak: 0,
        longestStreak: 0,
        totalSubmissions: 0
      });
    }

    res.json({
      currentStreak: streak.currentStreak,
      longestStreak: streak.longestStreak,
      totalSubmissions: streak.totalSubmissions,
      lastSubmissionDate: streak.lastSubmissionDate,
      milestonesAchieved: streak.milestonesAchieved.map(m => ({
        milestoneId: m.milestoneId._id || m.milestoneId,
        name: m.milestoneId.name || null,
        icon: m.milestoneId.icon || null,
        dayCount: m.milestoneId.dayCount || null,
        achievedAt: m.achievedAt
      }))
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

