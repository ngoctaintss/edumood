import mongoose from 'mongoose';

const rewardSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  cost: {
    type: Number,
    required: true,
    min: 0
  },
  imageUrl: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const Reward = mongoose.model('Reward', rewardSchema);

export default Reward;
