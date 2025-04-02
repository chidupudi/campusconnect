import React, { useState, useEffect } from 'react';
import { 
  Container,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Grid,
  TextField,
  Box,
  CircularProgress,
  Chip,
  Button,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import axios from 'axios';
import { format } from 'date-fns';

const AllEventsPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [purchaseDialog, setPurchaseDialog] = useState({
    open: false,
    event: null,
    quantity: 1
  });
  const [purchaseCounts, setPurchaseCounts] = useState({});

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/events/all');
        setEvents(response.data);
        
        // Initialize purchase counts
        const counts = {};
        response.data.forEach(event => {
          counts[event._id] = event.purchaseCount || 0;
        });
        setPurchaseCounts(counts);
      } catch (error) {
        console.error('Error fetching events:', error);
        showSnackbar('Failed to load events', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handlePurchaseClick = (event) => {
    const token = localStorage.getItem('token');
    if (!token) {
      showSnackbar('Please login to purchase tickets', 'error');
      return;
    }
    setPurchaseDialog({
      open: true,
      event,
      quantity: 1
    });
  };

  const handlePurchaseConfirm = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `http://localhost:5000/api/events/${purchaseDialog.event._id}/purchase`,
        { quantity: purchaseDialog.quantity },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // Update local state
      setPurchaseCounts(prev => ({
        ...prev,
        [purchaseDialog.event._id]: response.data.purchaseCount
      }));

      showSnackbar(`Successfully purchased ${purchaseDialog.quantity} ticket(s)!`, 'success');
      setPurchaseDialog({ open: false, event: null, quantity: 1 });
    } catch (error) {
      console.error('Purchase error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to purchase ticket';
      showSnackbar(errorMessage, 'error');
    }
  };

  const handleQuantityChange = (e) => {
    const value = Math.max(1, parseInt(e.target.value) || 1); // Fixed missing closing parenthesis
    setPurchaseDialog(prev => ({
      ...prev,
      quantity: value
    }));
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         event.venue.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = filterDate ? 
                       format(new Date(event.date), 'yyyy-MM-dd') === filterDate : 
                       true;
    return matchesSearch && matchesDate;
  });

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
        All Campus Events
      </Typography>

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
        <TextField
          label="Search events"
          variant="outlined"
          size="small"
          fullWidth
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <TextField
          label="Filter by date"
          type="date"
          size="small"
          InputLabelProps={{ shrink: true }}
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
        />
      </Box>

      {/* Events Grid */}
      <Grid container spacing={3}>
        {filteredEvents.length > 0 ? (
          filteredEvents.map(event => (
            <Grid item xs={12} sm={6} md={4} key={event._id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardMedia
                  component="img"
                  height="160"
                  image={event.club?.image || 'https://via.placeholder.com/300x200'}
                  alt={event.name}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography gutterBottom variant="h6" component="div">
                    {event.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {format(new Date(event.date), 'MMMM d, yyyy')} • {event.venue}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    ₹{event.price.toFixed(2)} per ticket
                  </Typography>
                  <Typography variant="caption" display="block" sx={{ mb: 1 }}>
                    {purchaseCounts[event._id] || 0} tickets sold
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Chip 
                      label={event.club?.name || 'Unknown Club'} 
                      size="small" 
                      color="primary" 
                    />
                    <Button 
                      variant="contained" 
                      color="primary"
                      size="small"
                      onClick={() => handlePurchaseClick(event)}
                      sx={{ ml: 1 }}
                    >
                      Purchase
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))
        ) : (
          <Typography sx={{ width: '100%', textAlign: 'center', mt: 4 }}>
            No events found
          </Typography>
        )}
      </Grid>

      {/* Purchase Dialog */}
      <Dialog open={purchaseDialog.open} onClose={() => setPurchaseDialog({ open: false, event: null })}>
        <DialogTitle>Purchase Tickets</DialogTitle>
        <DialogContent>
          {purchaseDialog.event && (
            <>
              <Typography gutterBottom>
                You're purchasing tickets for: <strong>{purchaseDialog.event.name}</strong>
              </Typography>
              <Typography gutterBottom>
                Date: {format(new Date(purchaseDialog.event.date), 'MMMM d, yyyy')}
              </Typography>
              <Typography gutterBottom>
                Price: ₹{purchaseDialog.event.price.toFixed(2)} per ticket
              </Typography>
              <TextField
                autoFocus
                margin="dense"
                label="Quantity"
                type="number"
                fullWidth
                variant="standard"
                value={purchaseDialog.quantity}
                onChange={handleQuantityChange}
                inputProps={{ min: 1 }}
              />
              <Typography variant="h6" sx={{ mt: 2 }}>
                Total: ₹{(purchaseDialog.event.price * purchaseDialog.quantity).toFixed(2)}
              </Typography>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPurchaseDialog({ open: false, event: null })}>Cancel</Button>
          <Button onClick={handlePurchaseConfirm} variant="contained">Confirm Purchase</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AllEventsPage;