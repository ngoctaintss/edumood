import mongoose from 'mongoose';

const streakSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
    unique: true
  },
  currentStreak: {
    type: Number,
    default: 0
  },
  longestStreak: {
    type: Number,
    default: 0
  },
  lastSubmissionDate: {
    type: Date
  },
  totalSubmissions: {
    type: Number,
    default: 0
  },
  milestonesAchieved: [{
    milestoneId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Milestone'
    },
    achievedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Index for faster queries (studentId already has unique index from unique: true)
streakSchema.index({ currentStreak: -1 });

const Streak = mongoose.model('Streak', streakSchema);

export default Streak;

