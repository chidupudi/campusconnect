const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Club Schema
const clubSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  description: { type: String },
  password: { type: String, required: true }
});

// Hash password before saving
clubSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Method to compare passwords
clubSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const Club = mongoose.model('Club', clubSchema);

// Club Signup
router.post('/signup', async (req, res) => {
  try {
    const { name, email, description, password } = req.body;
    
    // Check if club exists
    const existingClub = await Club.findOne({ email });
    if (existingClub) {
      return res.status(400).json({ message: 'Club already exists' });
    }

    // Create new club
    const club = new Club({ name, email, description, password });
    await club.save();

    // Generate JWT token with complete club information
    const token = jwt.sign(
      {
        id: club._id,
        name: club.name,
        email: club.email,
        role: 'club'
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1h' }
    );

    res.status(201).json({ 
      token,
      club: {
        id: club._id,
        name: club.name,
        email: club.email,
        description: club.description
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Club Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const club = await Club.findOne({ email });
    if (!club) {
      return res.status(404).json({ message: 'Club not found' });
    }

    const isMatch = await club.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token with complete club information
    const token = jwt.sign(
      {
        id: club._id,
        name: club.name,
        email: club.email,
        role: 'club'
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1h' }
    );

    res.json({ 
      token,
      club: {
        id: club._id,
        name: club.name,
        email: club.email,
        description: club.description
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});
// Add to your club routes file
router.get('/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const club = await Club.findById(decoded.id)
      .select('-password -__v'); // Exclude sensitive fields

    if (!club) {
      return res.status(404).json({ message: 'Club not found' });
    }

    res.json({
      name: club.name,
      email: club.email,
      description: club.description || ''
    });
  } catch (error) {
    console.error('Club profile error:', error);
    res.status(500).json({ message: 'Error fetching club profile' });
  }
});

router.put('/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const { name, description } = req.body;

    const updatedClub = await Club.findByIdAndUpdate(
      decoded.id,
      { name, description },
      { new: true }
    ).select('-password -__v');

    res.json({
      message: 'Club profile updated successfully',
      club: updatedClub
    });
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({ message: 'Error updating club profile' });
  }
});
const AdminLogSchema = new mongoose.Schema({
  action: { type: String, required: true },
  targetType: { type: String },
  target: { type: mongoose.Schema.Types.ObjectId },
  admin: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  timestamp: { type: Date, default: Date.now }
});

const AdminLog = mongoose.model('AdminLog', AdminLogSchema);

// Admin middleware
const adminAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    req.adminId = decoded.id;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// Logging helper
const logAdminAction = async (action, targetType, targetId, adminId) => {
  try {
    await AdminLog.create({
      action,
      targetType,
      target: targetId,
      admin: adminId
    });
  } catch (error) {
    console.error('Failed to log admin action:', error);
  }
};

// ADMIN-ONLY ROUTES FOR CLUB MANAGEMENT
router.get('/admin/all', adminAuth, async (req, res) => {
  try {
    const clubs = await Club.find().select('-password -__v');
    res.json(clubs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching clubs' });
  }
});

router.put('/admin/:id', adminAuth, async (req, res) => {
  try {
    const updatedClub = await Club.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).select('-password -__v');
    
    await logAdminAction(
      'UPDATE_CLUB',
      'club',
      req.params.id,
      req.adminId
    );

    res.json(updatedClub);
  } catch (error) {
    res.status(500).json({ message: 'Error updating club' });
  }
});

router.delete('/admin/:id', adminAuth, async (req, res) => {
  try {
    await Club.findByIdAndDelete(req.params.id);
    
    await logAdminAction(
      'DELETE_CLUB',
      'club',
      req.params.id,
      req.adminId
    );

    res.json({ message: 'Club deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting club' });
  }
});

// Get all clubs (public endpoint)
router.get('/all', async (req, res) => {
  try {
    const clubs = await Club.find()
      .select('-password -__v') // Exclude sensitive fields
      .sort({ name: 1 }); // Sort alphabetically by name
    
    res.json(clubs);
  } catch (error) {
    console.error('Error fetching clubs:', error);
    res.status(500).json({ message: 'Error fetching clubs' });
  }
});

module.exports = router;