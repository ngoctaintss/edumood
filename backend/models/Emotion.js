import mongoose from 'mongoose';

const emotionSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  emotion: {
    type: String,
    required: true,
    enum: ['happy', 'neutral', 'sad', 'angry', 'tired']
  },
  message: {
    type: String,
    default: ''
  },
  date: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
emotionSchema.index({ studentId: 1, date: -1 });
emotionSchema.index({ date: -1 });

const Emotion = mongoose.model('Emotion', emotionSchema);

export default Emotion;
