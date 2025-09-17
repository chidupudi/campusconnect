const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const studentRoutes = require('./services/student');
const clubRoutes = require('./services/club');
const adminRoutes = require('./services/admin');
const eventRoutes = require('./services/ClubHome');
// const adminLogRoutes = require('./services/admin-logs');

const app = express();

// Enhanced logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - IP: ${req.ip}`);
  next();
});

// Middleware
const corsOrigins = [
  'http://localhost:3500',
  'http://localhost:3000',
  'http://frontend-service:3500',
  process.env.FRONTEND_URL,
  process.env.FRONTEND_SERVICE_URL
].filter(Boolean);

app.use(cors({
  origin: corsOrigins,
  credentials: true
}));
app.use(express.json());

// MongoDB Atlas Connection
const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://druthi:druthi%402004@devops-cc.w5sl0nw.mongodb.net/campusconnect?retryWrites=true&w=majority&appName=devops-cc';

console.log('[SERVER] Connecting to MongoDB Atlas...');
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
  .then(() => {
    console.log('[DATABASE] ✅ Connected to MongoDB Atlas successfully');
    console.log('[DATABASE] Database Name:', mongoose.connection.name);
  })
  .catch(err => {
    console.error('[DATABASE] ❌ MongoDB Atlas connection error:', err);
    process.exit(1);
  });

// API Routes with logging
app.use('/api/students', (req, res, next) => {
  console.log(`[API] Student route accessed: ${req.method} ${req.url}`);
  next();
}, studentRoutes);

app.use('/api/clubs', (req, res, next) => {
  console.log(`[API] Club route accessed: ${req.method} ${req.url}`);
  next();
}, clubRoutes);

app.use('/api/admin', (req, res, next) => {
  console.log(`[API] Admin route accessed: ${req.method} ${req.url}`);
  next();
}, adminRoutes);

app.use('/api/events', (req, res, next) => {
  console.log(`[API] Event route accessed: ${req.method} ${req.url}`);
  next();
}, eventRoutes);

// app.use('/api/admin/logs', adminLogRoutes);

// Health check endpoint with enhanced logging
app.get('/health', (req, res) => {
  const healthInfo = {
    status: 'OK',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  };
  console.log('[HEALTH] Health check requested:', healthInfo);
  res.status(200).json(healthInfo);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(`[ERROR] ${new Date().toISOString()} - ${err.stack}`);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong!'
  });
});

// 404 handler
app.use('*', (req, res) => {
  console.log(`[404] Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ error: 'Route not found' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[SERVER] ✅ CampusConnect Backend running on port ${PORT}`);
  console.log(`[SERVER] Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`[SERVER] API Base URL: http://localhost:${PORT}`);
  console.log(`[SERVER] CORS Origins:`, corsOrigins);
  console.log(`[SERVER] MongoDB URI: ${mongoURI ? 'Connected' : 'Not configured'}`);
});