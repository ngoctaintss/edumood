import mongoose from 'mongoose';

const milestoneSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  dayCount: {
    type: Number,
    required: true,
    min: 1,
    unique: true // Only one milestone per day count
  },
  rewardPoints: {
    type: Number,
    default: 0,
    min: 0
  },
  rewardMessage: {
    type: String,
    default: ''
  },
  icon: {
    type: String,
    default: '🏆' // Emoji icon
  },
  color: {
    type: String,
    default: '#FFD700' // Gold color
  },
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0 // For sorting
  }
}, {
  timestamps: true
});

// Index for faster queries (dayCount already has unique index from unique: true)
milestoneSchema.index({ isActive: 1, order: 1 });

const Milestone = mongoose.model('Milestone', milestoneSchema);

export default Milestone;

