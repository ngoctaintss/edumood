import Class from '../models/Class.js';
import Teacher from '../models/Teacher.js';
import Student from '../models/Student.js';

// @desc    Get all classes
// @route   GET /api/classes
// @access  Private (Admin)
export const getAllClasses = async (req, res) => {
  try {
    const classes = await Class.find()
      .populate('teacherId', 'name email')
      .populate('studentIds', 'name studentId');

    res.json(classes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get class by ID
// @route   GET /api/classes/:id
// @access  Private (Admin/Teacher)
export const getClassById = async (req, res) => {
  try {
    const classData = await Class.findById(req.params.id)
      .populate('teacherId', 'name email')
      .populate('studentIds', 'name studentId points');

    if (!classData) {
      return res.status(404).json({ message: 'Class not found' });
    }

    res.json(classData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create a new class
// @route   POST /api/classes
// @access  Private (Admin)
export const createClass = async (req, res) => {
  try {
    const { name, teacherId } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Please provide class name' });
    }

    // Create class
    const newClass = await Class.create({
      name,
      teacherId: teacherId || null,
      studentIds: []
    });

    // If teacher assigned, add class to teacher's classIds
    if (teacherId) {
      await Teacher.findByIdAndUpdate(teacherId, {
        $push: { classIds: newClass._id }
      });
    }

    const classData = await Class.findById(newClass._id)
      .populate('teacherId', 'name email');

    res.status(201).json(classData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update a class
// @route   PUT /api/classes/:id
// @access  Private (Admin)
export const updateClass = async (req, res) => {
  try {
    const { name, teacherId } = req.body;

    const classData = await Class.findById(req.params.id);

    if (!classData) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // If teacher is being changed
    if (teacherId !== undefined && teacherId !== classData.teacherId?.toString()) {
      // Remove class from old teacher
      if (classData.teacherId) {
        await Teacher.findByIdAndUpdate(classData.teacherId, {
          $pull: { classIds: classData._id }
        });
      }

      // Add class to new teacher
      if (teacherId) {
        await Teacher.findByIdAndUpdate(teacherId, {
          $push: { classIds: classData._id }
        });
      }

      classData.teacherId = teacherId || null;
    }

    if (name) classData.name = name;

    await classData.save();

    const updatedClass = await Class.findById(req.params.id)
      .populate('teacherId', 'name email')
      .populate('studentIds', 'name studentId');

    res.json(updatedClass);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete a class
// @route   DELETE /api/classes/:id
// @access  Private (Admin)
export const deleteClass = async (req, res) => {
  try {
    const classData = await Class.findById(req.params.id);

    if (!classData) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // Check if class has students
    if (classData.studentIds.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete class with students. Please reassign or delete students first.' 
      });
    }

    // Remove class from teacher
    if (classData.teacherId) {
      await Teacher.findByIdAndUpdate(classData.teacherId, {
        $pull: { classIds: classData._id }
      });
    }

    await Class.findByIdAndDelete(req.params.id);

    res.json({ message: 'Class deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Assign teacher to class
// @route   PUT /api/classes/:id/assign-teacher
// @access  Private (Admin)
export const assignTeacher = async (req, res) => {
  try {
    const { teacherId } = req.body;
    const classId = req.params.id;

    const classData = await Class.findById(classId);

    if (!classData) {
      return res.status(404).json({ message: 'Class not found' });
    }

    const teacher = await Teacher.findById(teacherId);

    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    // Remove from old teacher if exists
    if (classData.teacherId) {
      await Teacher.findByIdAndUpdate(classData.teacherId, {
        $pull: { classIds: classId }
      });
    }

    // Assign to new teacher
    classData.teacherId = teacherId;
    await classData.save();

    // Add to teacher's classes
    if (!teacher.classIds.includes(classId)) {
      await Teacher.findByIdAndUpdate(teacherId, {
        $push: { classIds: classId }
      });
    }

    const updatedClass = await Class.findById(classId)
      .populate('teacherId', 'name email');

    res.json(updatedClass);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
