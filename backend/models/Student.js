import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema({
  studentId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  points: {
    type: Number,
    default: 0
  },
  role: {
    type: String,
    default: 'student'
  }
}, {
  timestamps: true
});

const Student = mongoose.model('Student', studentSchema);

export default Student;
