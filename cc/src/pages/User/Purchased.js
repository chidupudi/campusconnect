import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  TextField,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  CircularProgress,
  Paper
} from "@mui/material";
import axios from "axios";
import { format } from "date-fns";

const Purchased = () => {
  const [purchasedEvents, setPurchasedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("");

  useEffect(() => {
    const fetchPurchasedEvents = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("No authentication token found");
        }

        const response = await axios.get("http://localhost:5000/api/events/user/purchased-events", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        setPurchasedEvents(response.data);
      } catch (err) {
        console.error("Error fetching purchased events:", err);
        setError(err.response?.data?.message || "Failed to load purchased events");
      } finally {
        setLoading(false);
      }
    };

    fetchPurchasedEvents();
  }, []);

  const filteredEvents = purchasedEvents
    .filter(event =>
      event.name.toLowerCase().includes(search.toLowerCase()) ||
      event.club?.name.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sort === "dateAsc") return new Date(a.date) - new Date(b.date);
      if (sort === "dateDesc") return new Date(b.date) - new Date(a.date);
      if (sort === "purchaseAsc") return new Date(a.purchasedAt) - new Date(b.purchasedAt);
      if (sort === "purchaseDesc") return new Date(b.purchasedAt) - new Date(a.purchasedAt);
      return 0;
    });

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Paper sx={{ p: 3, textAlign: "center", mt: 3 }}>
        <Typography color="error">{error}</Typography>
      </Paper>
    );
  }

  return (
    <Box sx={{ padding: "20px" }}>
      {/* Filters */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          flexWrap: "wrap",
          gap: 2,
          mb: 4,
        }}
      >
        <TextField
          label="Search by Event or Club"
          size="small"
          variant="outlined"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ flexGrow: 1, maxWidth: 400 }}
        />
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Sort By</InputLabel>
          <Select
            value={sort}
            label="Sort By"
            onChange={(e) => setSort(e.target.value)}
          >
            <MenuItem value="">None</MenuItem>
            <MenuItem value="dateAsc">Event Date: Oldest First</MenuItem>
            <MenuItem value="dateDesc">Event Date: Newest First</MenuItem>
            <MenuItem value="purchaseAsc">Purchase Date: Oldest First</MenuItem>
            <MenuItem value="purchaseDesc">Purchase Date: Newest First</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Grid Display */}
      {filteredEvents.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: "center" }}>
          <Typography>No purchased events found</Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {filteredEvents.map((event) => (
            <Grid item xs={12} sm={6} md={4} key={event.purchaseId}>
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    {event.name}
                  </Typography>
                  <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 2 }}>
                    {event.club?.name}
                  </Typography>
                  
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Event Date:</strong> {format(new Date(event.date), "PPP")}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Venue:</strong> {event.venue}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Price:</strong> ₹{event.price?.toFixed(2)}
                  </Typography>
                  
                  <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                    <Typography variant="caption" display="block">
                      <strong>Purchased On:</strong> {format(new Date(event.purchasedAt), "PPPp")}
                    </Typography>
                    <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                      <strong>Ticket ID:</strong> {event.purchaseId}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default Purchased;