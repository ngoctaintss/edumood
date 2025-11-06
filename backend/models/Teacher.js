import mongoose from 'mongoose';

const teacherSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  classIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class'
  }],
  role: {
    type: String,
    default: 'teacher'
  }
}, {
  timestamps: true
});

const Teacher = mongoose.model('Teacher', teacherSchema);

export default Teacher;
