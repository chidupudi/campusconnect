import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  TextField, 
  Button, 
  Card, 
  CardContent,
  Snackbar, 
  Alert, 
  CircularProgress,
  Chip,
  Grid,
  Box
} from '@mui/material';
import axios from 'axios';
import { format } from 'date-fns';
import { jwtDecode } from 'jwt-decode';

const ClubHome = () => {
  const [eventData, setEventData] = useState({ 
    name: '', 
    date: '', 
    venue: '', 
    price: '' 
  });
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState({ 
    create: false, 
    fetch: false, 
    delete: false 
  });
  const [snackbar, setSnackbar] = useState({ 
    open: false, 
    message: '', 
    severity: 'success' 
  });

  // Get club ID from token
  const getClubId = () => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No token found');
    const decoded = jwtDecode(token);
    return decoded.id;
  };

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(prev => ({ ...prev, fetch: true }));
        const clubId = getClubId();
        
        const res = await axios.get(`http://localhost:5000/api/events/club`, {
          headers: { 
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });

        setEvents(res.data.map(event => ({
          ...event,
          purchaseCount: event.purchaseCount || 0,
          price: event.price || 0,
          date: event.date || new Date()
        })));

      } catch (error) {
        console.error('Fetch error:', error.response?.data || error.message);
        setSnackbar({
          open: true,
          message: error.response?.data?.message || 'Failed to load events',
          severity: 'error'
        });
      } finally {
        setLoading(prev => ({ ...prev, fetch: false }));
      }
    };

    fetchEvents();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(prev => ({ ...prev, create: true }));
      const clubId = getClubId();
      
      const res = await axios.post('http://localhost:5000/api/events', {
        ...eventData,
        club: clubId
      }, {
        headers: { 
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      setEvents([...events, res.data]);
      setEventData({ name: '', date: '', venue: '', price: '' });
      setSnackbar({
        open: true,
        message: 'Event created successfully!',
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Error creating event',
        severity: 'error'
      });
    } finally {
      setLoading(prev => ({ ...prev, create: false }));
    }
  };

  const handleDelete = async (id) => {
    try {
      setLoading(prev => ({ ...prev, [id]: true }));
      await axios.delete(`http://localhost:5000/api/events/${id}`, {
        headers: { 
          Authorization: `Bearer ${localStorage.getItem('token')}` 
        }
      });
      setEvents(events.filter(event => event._id !== id));
      setSnackbar({
        open: true,
        message: 'Event deleted successfully',
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to delete event',
        severity: 'error'
      });
    } finally {
      setLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  return (
    <Container maxWidth="md">
      <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
        Club Dashboard
      </Typography>
      
      {/* Event Form */}
      <Box component="form" onSubmit={handleSubmit} sx={{ mb: 4 }}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              name="name"
              label="Event Name"
              fullWidth
              required
              value={eventData.name}
              onChange={(e) => setEventData({...eventData, name: e.target.value})}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              name="date"
              label="Date"
              type="date"
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
              value={eventData.date}
              onChange={(e) => setEventData({...eventData, date: e.target.value})}
              inputProps={{ min: new Date().toISOString().split('T')[0] }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              name="venue"
              label="Venue"
              fullWidth
              required
              value={eventData.venue}
              onChange={(e) => setEventData({...eventData, venue: e.target.value})}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              name="price"
              label="Price (₹)"
              type="number"
              fullWidth
              required
              value={eventData.price}
              onChange={(e) => setEventData({...eventData, price: e.target.value})}
              inputProps={{ min: 0, step: "0.01" }}
            />
          </Grid>
          <Grid item xs={12}>
            <Button 
              type="submit" 
              variant="contained" 
              disabled={loading.create}
              fullWidth
            >
              {loading.create ? <CircularProgress size={24} /> : 'Create Event'}
            </Button>
          </Grid>
        </Grid>
      </Box>

      {/* Events List */}
      {loading.fetch ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={2}>
          {events.map(event => (
            <Grid item xs={12} key={event._id}>
              <Card>
                <CardContent>
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 1
                  }}>
                    <Typography variant="h6">{event.name}</Typography>
                    <Chip 
                      label={`${event.purchaseCount || 0} tickets sold`} 
                      color="success"
                      size="small"
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {format(new Date(event.date), 'MMMM d, yyyy')} • {event.venue}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Price: ₹{event.price?.toFixed(2) || '0.00'}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                    <Button 
                      onClick={() => handleDelete(event._id)} 
                      color="error"
                      size="small"
                      disabled={loading[event._id]}
                      startIcon={loading[event._id] ? <CircularProgress size={16} /> : null}
                    >
                      Delete
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({...snackbar, open: false})}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          severity={snackbar.severity}
          onClose={() => setSnackbar({...snackbar, open: false})}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ClubHome;