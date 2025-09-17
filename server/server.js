// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Routers
const studentRoutes = require('./services/student');
const clubRoutes    = require('./services/club');
const adminRoutes   = require('./services/admin');
const eventRoutes   = require('./services/ClubHome');

const app = express();

/* ============================
   CORS (browser -> k8s NodePort)
   ============================ */
app.use(
  cors({
    origin: 'http://localhost:30500',           // your React app
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false,                          // we are not using cookies
  })
);
// Handle preflight for all routes
app.options('*', cors());

/* ============================
   Core middleware
   ============================ */
app.use(express.json());

/* ============================
   MongoDB
   ============================ */
const mongoURI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/campusConnect';

mongoose
  .connect(mongoURI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

/* ============================
   Routes
   ============================ */
app.use('/api/students', studentRoutes);
app.use('/api/clubs',    clubRoutes);
app.use('/api/admin',    adminRoutes);
app.use('/api/events',   eventRoutes);

// Optional aliases (allow both URL styles)
app.use('/api/auth/student', studentRoutes);
app.use('/api/auth/club',    clubRoutes);

/* ============================
   Health
   ============================ */
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

/* ============================
   Start server
   ============================ */
const PORT = process.env.PORT || 5000;  // <— must be 5000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
