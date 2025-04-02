const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

// Enhanced Event Model with purchase tracking
const EventSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  date: { type: Date, required: true },
  venue: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  club: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Club' },
  createdAt: { type: Date, default: Date.now },
  purchases: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    purchasedAt: { type: Date, default: Date.now }
  }],
  purchaseCount: { type: Number, default: 0 }
});

const Event = mongoose.model('Event', EventSchema);

// Middleware to verify JWT
const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.userId = decoded.id;
    req.userRole = decoded.role;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Middleware to verify Club JWT
const clubAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    if (decoded.role !== 'club') {
      return res.status(403).json({ message: 'Access denied. Club authorization required' });
    }
    req.clubId = decoded.id;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Club-specific events endpoint
router.get('/club', clubAuth, async (req, res) => {
  try {
    const events = await Event.find({ club: req.clubId })
      .populate('club', 'name')
      .select('name date venue price purchaseCount')
      .sort({ date: -1 });
    
    if (!events || events.length === 0) {
      return res.status(404).json({ message: 'No events found for this club' });
    }
    
    res.json(events);
  } catch (error) {
    console.error('Error fetching club events:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: error.message
    });
  }
});

// Public events endpoint
router.get('/all', async (req, res) => {
  try {
    const events = await Event.find()
      .populate('club', 'name description image')
      .sort({ date: -1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new event
router.post('/', clubAuth, async (req, res) => {
  try {
    const { name, date, venue, price } = req.body;
    
    if (!name || !date || !venue || price === undefined) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const event = new Event({
      name,
      date: new Date(date),
      venue,
      price: parseFloat(price),
      club: req.clubId
    });

    await event.save();
    res.status(201).json(event);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message) 
      });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete event
router.delete('/:id', clubAuth, async (req, res) => {
  try {
    const event = await Event.findOneAndDelete({
      _id: req.params.id,
      club: req.clubId
    });
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found or not authorized' });
    }
    
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Purchase ticket for an event
router.post('/:id/purchase', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if user already purchased
    const alreadyPurchased = event.purchases.some(
      purchase => purchase.user.toString() === req.userId
    );
    
    if (alreadyPurchased) {
      return res.status(400).json({ message: 'You have already purchased this event' });
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      {
        $push: { purchases: { user: req.userId } },
        $inc: { purchaseCount: 1 }
      },
      { new: true }
    ).populate('club', 'name email');

    res.json({
      success: true,
      message: 'Ticket purchased successfully',
      purchaseCount: updatedEvent.purchaseCount,
      event: {
        id: updatedEvent._id,
        name: updatedEvent.name,
        date: updatedEvent.date
      }
    });

  } catch (error) {
    console.error('Purchase error:', error);
    res.status(500).json({ 
      message: 'Purchase failed', 
      error: error.message 
    });
  }
});
// Get all events user has purchased
router.get('/user/purchased-events', auth, async (req, res) => {
  try {
    const events = await Event.find({
      'purchases.user': req.userId
    })
    .populate('club', 'name image')
    .sort({ date: -1 });

    // Format the response to include purchase details
    const purchasedEvents = events.map(event => {
      const userPurchase = event.purchases.find(p => p.user.toString() === req.userId);
      return {
        eventId: event._id,
        name: event.name,
        date: event.date,
        venue: event.venue,
        price: event.price,
        club: {
          id: event.club?._id,
          name: event.club?.name,
          image: event.club?.image
        },
        purchasedAt: userPurchase?.purchasedAt,
        purchaseId: userPurchase?._id
      };
    });

    res.json(purchasedEvents);
  } catch (error) {
    console.error('Error fetching purchased events:', error);
    res.status(500).json({ 
      message: 'Error fetching purchased events',
      error: error.message
    });
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

// ADMIN-ONLY ROUTES FOR EVENT MANAGEMENT
router.get('/admin/all', adminAuth, async (req, res) => {
  try {
    const events = await Event.find()
      .populate('club', 'name')
      .sort({ createdAt: -1 });
    
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching events' });
  }
});

router.put('/admin/:id', adminAuth, async (req, res) => {
  try {
    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true }
    ).populate('club', 'name');
    
    await AdminLog.create({
      action: 'UPDATE_EVENT',
      targetType: 'event',
      target: req.params.id,
      admin: req.adminId
    });

    res.json(updatedEvent);
  } catch (error) {
    res.status(500).json({ message: 'Error updating event' });
  }
});

router.delete('/admin/:id', adminAuth, async (req, res) => {
  try {
    await Event.findByIdAndDelete(req.params.id);
    
    await AdminLog.create({
      action: 'DELETE_EVENT',
      targetType: 'event',
      target: req.params.id,
      admin: req.adminId
    });

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting event' });
  }
});

// Get purchase stats for a club's events
router.get('/club/stats', clubAuth, async (req, res) => {
  try {
    const events = await Event.find({ club: req.clubId })
      .select('name date purchaseCount purchases')
      .populate('purchases.user', 'name email')
      .sort({ date: -1 });

    const stats = events.map(event => ({
      id: event._id,
      name: event.name,
      date: event.date,
      totalPurchases: event.purchaseCount,
      recentPurchases: event.purchases
        .sort((a, b) => b.purchasedAt - a.purchasedAt)
        .slice(0, 5)
    }));

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get stats' });
  }
});

module.exports = router;