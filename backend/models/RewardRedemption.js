import mongoose from 'mongoose';

const rewardRedemptionSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  rewardId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Reward',
    required: true
  },
  rewardName: {
    type: String,
    required: true
  },
  pointsSpent: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  }
}, {
  timestamps: true
});

const RewardRedemption = mongoose.model('RewardRedemption', rewardRedemptionSchema);

export default RewardRedemption;
