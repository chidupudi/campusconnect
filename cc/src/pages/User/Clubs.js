import React, { useState, useEffect } from "react";
import {
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  TextField,
  Box,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  CardActionArea,
  CircularProgress
} from "@mui/material";
import axios from "axios";

const Clubs = () => {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchClubs = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get("http://localhost:5000/api/clubs/all", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setClubs(response.data);
      } catch (err) {
        console.error("Error fetching clubs:", err);
        setError(err.response?.data?.message || "Failed to load clubs");
      } finally {
        setLoading(false);
      }
    };

    fetchClubs();
  }, []);

  const filteredClubs = clubs
    .filter((club) =>
      club.name.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "az") return a.name.localeCompare(b.name);
      if (sortBy === "za") return b.name.localeCompare(a.name);
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
      <Box sx={{ padding: "20px", textAlign: "center" }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  const getRandomColor = () => {
    const colors = [
      "#FF5733", "#33FF57", "#3357FF", "#FF33A1", "#A133FF", "#33FFF5", "#FFC733",
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  return (
    <Box sx={{ padding: "20px", maxWidth: "100%" }}>
      {/* Filters */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 2,
          mb: 4,
          flexWrap: "wrap",
        }}
      >
        <TextField
          label="Search Club"
          variant="outlined"
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ flexGrow: 1, maxWidth: 400 }}
        />
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Sort</InputLabel>
          <Select
            value={sortBy}
            label="Sort"
            onChange={(e) => setSortBy(e.target.value)}
          >
            <MenuItem value="">None</MenuItem>
            <MenuItem value="az">A-Z</MenuItem>
            <MenuItem value="za">Z-A</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Club Cards */}
      <Grid 
        container 
        spacing={3}
        sx={{
          justifyContent: "flex-start",
          alignItems: "stretch"
        }}
      >
        {filteredClubs.map((club) => (
          <Grid 
            item 
            xs={12} 
            sm={6} 
            md={4} 
            key={club._id}
            sx={{
              display: "flex",
              minWidth: 300
            }}
          >
            <Card
              sx={{
                width: "100%",
                display: "flex",
                flexDirection: "column",
                position: "relative",
                overflow: "hidden",
                transition: "0.3s",
                "&:hover .hoverInfo": { opacity: 1 },
              }}
            >
              <CardActionArea sx={{ height: "100%" }}>
                <CardMedia
                  component="div"
                  sx={{
                    height: 180,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: club.image ? "transparent" : getRandomColor(),
                    color: "white",
                    fontSize: "2rem",
                    fontWeight: "bold",
                  }}
                >
                  {club.image ? (
                    <img
                      src={club.image}
                      alt={club.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    club.name.charAt(0).toUpperCase()
                  )}
                </CardMedia>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    {club.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {club.description}
                  </Typography>
                </CardContent>

                {/* Hover Overlay */}
                <Box
                  className="hoverInfo"
                  sx={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    bgcolor: "rgba(0,0,0,0.75)",
                    color: "white",
                    opacity: 0,
                    transition: "0.3s ease",
                    padding: 2,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    textAlign: "center",
                  }}
                >
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    <strong>Email:</strong> {club.email}
                  </Typography>
                </Box>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Clubs;