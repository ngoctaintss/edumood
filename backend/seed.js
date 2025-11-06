import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import Admin from './models/Admin.js';
import Teacher from './models/Teacher.js';
import Class from './models/Class.js';
import Student from './models/Student.js';
import Reward from './models/Reward.js';

dotenv.config();

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await Admin.deleteMany({});
    await Teacher.deleteMany({});
    await Class.deleteMany({});
    await Student.deleteMany({});
    await Reward.deleteMany({});
    console.log('Cleared existing data');

    // Create Admin
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await Admin.create({
      name: 'Admin User',
      email: 'admin@emotionschool.com',
      password: adminPassword
    });
    console.log('✅ Admin created');

    // Create Teachers
    const teacherPassword = await bcrypt.hash('teacher123', 10);
    const teacher1 = await Teacher.create({
      name: 'Ms. Sarah Johnson',
      email: 'sarah@emotionschool.com',
      password: teacherPassword,
      classIds: []
    });

    const teacher2 = await Teacher.create({
      name: 'Mr. David Lee',
      email: 'david@emotionschool.com',
      password: teacherPassword,
      classIds: []
    });
    console.log('✅ Teachers created');

    // Create Classes
    const class1 = await Class.create({
      name: 'Grade 3A',
      teacherId: teacher1._id,
      studentIds: []
    });

    const class2 = await Class.create({
      name: 'Grade 4B',
      teacherId: teacher2._id,
      studentIds: []
    });
    console.log('✅ Classes created');

    // Update teachers with classIds
    teacher1.classIds.push(class1._id);
    await teacher1.save();

    teacher2.classIds.push(class2._id);
    await teacher2.save();

    // Create Students
    const studentPassword = await bcrypt.hash('student123', 10);
    
    const students1 = [];
    for (let i = 1; i <= 5; i++) {
      const student = await Student.create({
        studentId: `STU001${i}`,
        name: `Student ${i} Class 3A`,
        password: studentPassword,
        classId: class1._id,
        points: Math.floor(Math.random() * 100)
      });
      students1.push(student._id);
    }

    const students2 = [];
    for (let i = 1; i <= 5; i++) {
      const student = await Student.create({
        studentId: `STU002${i}`,
        name: `Student ${i} Class 4B`,
        password: studentPassword,
        classId: class2._id,
        points: Math.floor(Math.random() * 100)
      });
      students2.push(student._id);
    }

    // Update classes with studentIds
    class1.studentIds = students1;
    await class1.save();

    class2.studentIds = students2;
    await class2.save();

    console.log('✅ Students created');

    // Create Rewards
    await Reward.create([
      {
        name: 'Extra Recess Time',
        cost: 50,
        description: 'Get 10 extra minutes of recess',
        imageUrl: ''
      },
      {
        name: 'Homework Pass',
        cost: 100,
        description: 'Skip one homework assignment',
        imageUrl: ''
      },
      {
        name: 'Classroom Helper Badge',
        cost: 75,
        description: 'Be the teacher\'s helper for a day',
        imageUrl: ''
      },
      {
        name: 'Sticker Pack',
        cost: 30,
        description: 'Get a pack of fun stickers',
        imageUrl: ''
      },
      {
        name: 'Pencil Set',
        cost: 40,
        description: 'Colorful pencil set',
        imageUrl: ''
      },
      {
        name: 'Book Choice',
        cost: 120,
        description: 'Choose the next class reading book',
        imageUrl: ''
      }
    ]);
    console.log('✅ Rewards created');

    console.log('\n🎉 Database seeded successfully!\n');
    console.log('📝 Login Credentials:');
    console.log('────────────────────────────────');
    console.log('Admin:');
    console.log('  Email: admin@emotionschool.com');
    console.log('  Password: admin123');
    console.log('\nTeacher 1:');
    console.log('  Email: sarah@emotionschool.com');
    console.log('  Password: teacher123');
    console.log('\nTeacher 2:');
    console.log('  Email: david@emotionschool.com');
    console.log('  Password: teacher123');
    console.log('\nStudents (any):');
    console.log('  Student ID: STU0011 to STU0015 (Class 3A)');
    console.log('  Student ID: STU0021 to STU0025 (Class 4B)');
    console.log('  Password: student123');
    console.log('────────────────────────────────\n');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
