const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Student Schema
const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  course: { type: String, required: true },
  password: { type: String, required: true }
});

// Hash password before saving
studentSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Method to compare passwords
studentSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const Student = mongoose.model('Student', studentSchema);

// Student Signup
router.post('/signup', async (req, res) => {
  try {
    const { name, email, course, password } = req.body;
    
    // Check if student exists
    const existingStudent = await Student.findOne({ email });
    if (existingStudent) {
      return res.status(400).json({ message: 'Student already exists' });
    }

    // Create new student
    const student = new Student({ name, email, course, password });
    await student.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: student._id, role: 'student' },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1h' }
    );

    res.status(201).json({ token, student: { id: student._id, name, email, course } });
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong' });
  }
});

// Student Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find student
    const student = await Student.findOne({ email });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Check password
    const isMatch = await student.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: student._id, role: 'student' },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1h' }
    );

    res.json({ token, student: { id: student._id, name: student.name, email: student.email, course: student.course } });
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong' });
  }
});

// Add this to your student routes file
router.get('/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const student = await Student.findById(decoded.id)
      .select('-password -__v'); // Exclude sensitive fields

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.json({
      firstName: student.name.split(' ')[0],
      lastName: student.name.split(' ').slice(1).join(' ') || '',
      email: student.email,
      department: student.course,
      year: '3' // You'll need to add year to your student model
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ message: 'Error fetching profile' });
  }
});

router.put('/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const { firstName, lastName, department } = req.body;

    // Update student profile
    const updatedStudent = await Student.findByIdAndUpdate(
      decoded.id,
      { 
        name: `${firstName} ${lastName}`.trim(),
        course: department
      },
      { new: true }
    ).select('-password -__v');

    res.json({
      message: 'Profile updated successfully',
      student: {
        firstName: updatedStudent.name.split(' ')[0],
        lastName: updatedStudent.name.split(' ').slice(1).join(' ') || '',
        email: updatedStudent.email,
        department: updatedStudent.course
      }
    });
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({ message: 'Error updating profile' });
  }
});

module.exports = router;