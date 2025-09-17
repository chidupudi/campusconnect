const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const studentRoutes = require('./services/student');
const clubRoutes = require('./services/club');
const adminRoutes = require('./services/admin');
const eventRoutes = require('./services/ClubHome');
// const adminLogRoutes = require('./services/admin-logs');

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:3500', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

// MongoDB Connection
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/campusConnect';
mongoose.connect(mongoURI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/students', studentRoutes);
app.use('/api/clubs', clubRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/events', eventRoutes);
// app.use('/api/admin/logs', adminLogRoutes);


// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});