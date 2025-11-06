import bcrypt from 'bcryptjs';
import Student from '../models/Student.js';
import Class from '../models/Class.js';

// @desc    Get all students in a class
// @route   GET /api/students/class/:classId
// @access  Private (Teacher)
export const getStudentsByClass = async (req, res) => {
  try {
    const { classId } = req.params;

    // Check if teacher has access to this class
    if (req.user.role === 'teacher' && !req.user.classIds.includes(classId)) {
      return res.status(403).json({ message: 'Not authorized to access this class' });
    }

    const students = await Student.find({ classId })
      .select('-password')
      .populate('classId', 'name');

    res.json(students);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create a new student
// @route   POST /api/students
// @access  Private (Teacher)
export const createStudent = async (req, res) => {
  try {
    const { studentId, name, password, classId } = req.body;

    if (!studentId || !name || !password || !classId) {
      return res.status(400).json({ message: 'Please provide all fields' });
    }

    // Check if teacher has access to this class
    if (req.user.role === 'teacher' && !req.user.classIds.some(id => id.toString() === classId)) {
      return res.status(403).json({ message: 'Not authorized to add students to this class' });
    }

    // Check if student ID already exists
    const existingStudent = await Student.findOne({ studentId });
    if (existingStudent) {
      return res.status(400).json({ message: 'Student ID already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create student
    const student = await Student.create({
      studentId,
      name,
      password: hashedPassword,
      classId,
      points: 0
    });

    // Add student to class
    await Class.findByIdAndUpdate(classId, {
      $push: { studentIds: student._id }
    });

    const studentData = await Student.findById(student._id)
      .select('-password')
      .populate('classId', 'name');

    res.status(201).json(studentData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update a student
// @route   PUT /api/students/:id
// @access  Private (Teacher)
export const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, password, points } = req.body;

    const student = await Student.findById(id);

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Check if teacher has access to this student's class
    if (req.user.role === 'teacher' && !req.user.classIds.some(classId => classId.toString() === student.classId.toString())) {
      return res.status(403).json({ message: 'Not authorized to update this student' });
    }

    // Update fields
    if (name) student.name = name;
    if (points !== undefined) student.points = points;
    
    if (password) {
      const salt = await bcrypt.genSalt(10);
      student.password = await bcrypt.hash(password, salt);
    }

    await student.save();

    const updatedStudent = await Student.findById(id)
      .select('-password')
      .populate('classId', 'name');

    res.json(updatedStudent);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete a student
// @route   DELETE /api/students/:id
// @access  Private (Teacher)
export const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;

    const student = await Student.findById(id);

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Check if teacher has access to this student's class
    if (req.user.role === 'teacher' && !req.user.classIds.some(classId => classId.toString() === student.classId.toString())) {
      return res.status(403).json({ message: 'Not authorized to delete this student' });
    }

    // Remove student from class
    await Class.findByIdAndUpdate(student.classId, {
      $pull: { studentIds: student._id }
    });

    await Student.findByIdAndDelete(id);

    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
