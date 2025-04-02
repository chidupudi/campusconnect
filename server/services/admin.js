const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Database connection check middleware
router.use((req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(500).json({ message: 'Database not connected' });
  }
  next();
});
// Verified admin account with working password hash
const admins = [
  {
    id: 1,
    email: 'admin1@gmail.com',
    password: 'admin123', // In production, store hashed password
    name: 'Admin',
    role: 'admin'
  }
];

// Simplified login - no validation
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = admins.find(a => 
      a.email.toLowerCase() === email.toLowerCase() && 
      a.password === password
    );

    if (!admin) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: admin.id, role: admin.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1h' }
    );

    const { password: _, ...adminData } = admin;
    res.json({ token, admin: adminData });
    
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin middleware for verifying tokens
const adminAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  
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
module.exports = router;