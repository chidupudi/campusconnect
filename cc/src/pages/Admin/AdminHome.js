import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  TableContainer,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Snackbar,
  Alert
} from "@mui/material";
import axios from "axios";
import { format } from "date-fns";

const AdminHome = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [editForm, setEditForm] = useState({});

  const API_BASE_URL = "http://localhost:5000/api";

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      
      const response = await axios.get(`${API_BASE_URL}/events/admin/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setEvents(response.data);

    } catch (err) {
      console.error("Error fetching events:", err);
      setError(err.response?.data?.message || "Failed to load events");
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEditClick = (event) => {
    setCurrentItem({ ...event, type: 'event' });
    setEditForm(event);
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (event) => {
    setCurrentItem({ ...event, type: 'event' });
    setDeleteDialogOpen(true);
  };

  const handleEditSubmit = async () => {
    try {
      setError(null);
      const token = localStorage.getItem("token");
      
      await axios.put(
        `${API_BASE_URL}/events/admin/${currentItem._id}`,
        editForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setEditDialogOpen(false);
      setSuccess("Event updated successfully");
      fetchData();
    } catch (err) {
      console.error("Update error:", err);
      setError(err.response?.data?.message || "Failed to update event");
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      setError(null);
      const token = localStorage.getItem("token");

      await axios.delete(
        `${API_BASE_URL}/events/admin/${currentItem._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setDeleteDialogOpen(false);
      setSuccess("Event deleted successfully");
      fetchData();
    } catch (err) {
      console.error("Delete error:", err);
      setError(err.response?.data?.message || "Failed to delete event");
    }
  };

  const handleCloseSnackbar = () => {
    setError(null);
    setSuccess(null);
  };

  if (loading) {
    return (
      <Box sx={{ 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center",
        height: "80vh"
      }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box sx={{ padding: "30px" }}>
      {/* Snackbars for notifications */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
      
      <Snackbar
        open={!!success}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
          {success}
        </Alert>
      </Snackbar>

      {/* Events Registered Card */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Card sx={{ height: "100%", textAlign: "center" }}>
            <CardContent>
              <Typography variant="h6">Events Registered</Typography>
              <Typography variant="h4">{events.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Events Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Event Name</TableCell>
              <TableCell>Club</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Venue</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {events.length > 0 ? (
              events.map((event) => (
                <TableRow key={event._id}>
                  <TableCell>{event.name}</TableCell>
                  <TableCell>{event.club?.name || 'N/A'}</TableCell>
                  <TableCell>{event.date ? format(new Date(event.date), "PPP") : 'N/A'}</TableCell>
                  <TableCell>{event.venue || 'N/A'}</TableCell>
                  <TableCell>
                    <Button 
                      size="small" 
                      color="primary"
                      onClick={() => handleEditClick(event)}
                      sx={{ mr: 1 }}
                    >
                      Edit
                    </Button>
                    <Button 
                      size="small" 
                      color="error"
                      onClick={() => handleDeleteClick(event)}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No events found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Edit Dialog */}
      <Dialog 
        open={editDialogOpen} 
        onClose={() => setEditDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Edit Event</DialogTitle>
        <DialogContent>
          {currentItem && (
            <Box sx={{ mt: 2 }}>
              {Object.keys(editForm)
                .filter(key => key !== '_id' && key !== '__v' && key !== 'password')
                .map((key) => (
                  <TextField
                    key={key}
                    label={key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                    value={editForm[key] || ''}
                    onChange={(e) => setEditForm({ ...editForm, [key]: e.target.value })}
                    fullWidth
                    margin="normal"
                    type={key.toLowerCase().includes('date') ? 'datetime-local' : 'text'}
                    InputLabelProps={
                      key.toLowerCase().includes('date') ? { shrink: true } : undefined
                    }
                  />
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleEditSubmit} color="primary" variant="contained">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog 
        open={deleteDialogOpen} 
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this event? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Confirm Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminHome;