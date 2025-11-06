import bcrypt from 'bcryptjs';
import Teacher from '../models/Teacher.js';
import Class from '../models/Class.js';

// @desc    Get all teachers
// @route   GET /api/teachers
// @access  Private (Admin)
export const getAllTeachers = async (req, res) => {
  try {
    const teachers = await Teacher.find()
      .select('-password')
      .populate('classIds', 'name');

    res.json(teachers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get teacher by ID
// @route   GET /api/teachers/:id
// @access  Private (Admin/Teacher)
export const getTeacherById = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id)
      .select('-password')
      .populate('classIds', 'name');

    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    res.json(teacher);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create a new teacher
// @route   POST /api/teachers
// @access  Private (Admin)
export const createTeacher = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide all fields' });
    }

    // Check if email already exists
    const existingTeacher = await Teacher.findOne({ email });
    if (existingTeacher) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create teacher
    const teacher = await Teacher.create({
      name,
      email,
      password: hashedPassword,
      classIds: []
    });

    const teacherData = await Teacher.findById(teacher._id).select('-password');

    res.status(201).json(teacherData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update a teacher
// @route   PUT /api/teachers/:id
// @access  Private (Admin)
export const updateTeacher = async (req, res) => {
  try {
    const { name, email, password, classIds } = req.body;

    const teacher = await Teacher.findById(req.params.id);

    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    // Update fields
    if (name) teacher.name = name;
    if (email) teacher.email = email;
    if (classIds) teacher.classIds = classIds;

    if (password) {
      const salt = await bcrypt.genSalt(10);
      teacher.password = await bcrypt.hash(password, salt);
    }

    await teacher.save();

    const updatedTeacher = await Teacher.findById(req.params.id)
      .select('-password')
      .populate('classIds', 'name');

    res.json(updatedTeacher);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete a teacher
// @route   DELETE /api/teachers/:id
// @access  Private (Admin)
export const deleteTeacher = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);

    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    // Remove teacher from all classes
    await Class.updateMany(
      { teacherId: teacher._id },
      { $unset: { teacherId: 1 } }
    );

    await Teacher.findByIdAndDelete(req.params.id);

    res.json({ message: 'Teacher deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get teacher's classes
// @route   GET /api/teachers/:id/classes
// @access  Private (Teacher/Admin)
export const getTeacherClasses = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id).populate('classIds', 'name studentIds');

    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    res.json(teacher.classIds);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
