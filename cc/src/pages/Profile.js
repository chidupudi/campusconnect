import React, { useEffect, useState } from "react";
import {
  Box,
  Grid,
  TextField,
  Typography,
  MenuItem,
  Button,
  CircularProgress,
  Paper,
  Avatar,
  IconButton
} from "@mui/material";
import { Edit, Save, Cancel } from "@mui/icons-material";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { deepPurple } from "@mui/material/colors";

const Profile = () => {
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    department: "",
    year: "",
  });
  const [originalProfile, setOriginalProfile] = useState(null);
  const [loading, setLoading] = useState({
    fetch: true,
    save: false
  });
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("No authentication token found");
        }

        const response = await axios.get("http://localhost:5000/api/students/profile", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        setProfile(response.data);
        setOriginalProfile(response.data);
      } catch (err) {
        console.error("Profile fetch error:", err);
        setError(err.response?.data?.message || "Failed to load profile");
      } finally {
        setLoading(prev => ({ ...prev, fetch: false }));
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setProfile((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(prev => ({ ...prev, save: true }));
      const token = localStorage.getItem("token");
      
      const response = await axios.put(
        "http://localhost:5000/api/students/profile",
        profile,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      );

      setProfile(response.data.student);
      setOriginalProfile(response.data.student);
      setEditMode(false);
      setError(null);
    } catch (err) {
      console.error("Save error:", err);
      setError(err.response?.data?.message || "Failed to save profile");
    } finally {
      setLoading(prev => ({ ...prev, save: false }));
    }
  };

  const handleCancel = () => {
    setProfile(originalProfile);
    setEditMode(false);
  };

  if (loading.fetch) {
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
    <Box sx={{ maxWidth: 800, mx: "auto", p: { xs: 2, md: 4 } }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2, position: "relative" }}>
        {/* Edit Button */}
        {!editMode && (
          <IconButton
            sx={{ position: "absolute", top: 16, right: 16 }}
            onClick={() => setEditMode(true)}
            color="primary"
          >
            <Edit />
          </IconButton>
        )}

        <Box sx={{ display: "flex", alignItems: "center", mb: 4 }}>
          <Avatar 
            sx={{ 
              bgcolor: deepPurple[500], 
              width: 56, 
              height: 56,
              mr: 3,
              fontSize: "1.5rem"
            }}
          >
            {profile.firstName.charAt(0)}{profile.lastName.charAt(0)}
          </Avatar>
          <Typography variant="h4" component="h1">
            My Profile
          </Typography>
        </Box>
       
<Grid container spacing={3}>
  <Grid item xs={12}>
    <TextField
      fullWidth
      label="First Name"
      name="firstName"
      value={profile.firstName}
      onChange={handleChange}
      variant="outlined"
      sx={{ backgroundColor: "#f9f9f9" }}
      InputProps={{
        readOnly: !editMode,
      }}
    />
  </Grid>
  <Grid item xs={12}>
    <TextField
      fullWidth
      label="Last Name"
      name="lastName"
      value={profile.lastName}
      onChange={handleChange}
      variant="outlined"
      sx={{ backgroundColor: "#f9f9f9" }}
      InputProps={{
        readOnly: !editMode,
      }}
    />
  </Grid>
  <Grid item xs={12}>
    <TextField
      fullWidth
      label="Email ID"
      name="email"
      value={profile.email}
      variant="outlined"
      sx={{ backgroundColor: "#f1f1f1" }}
      InputProps={{ 
        readOnly: true,
      }}
    />
  </Grid>
  <Grid item xs={12}>
    <TextField
      fullWidth
      label="Department"
      name="department"
      value={profile.department}
      onChange={handleChange}
      select
      variant="outlined"
      sx={{ backgroundColor: "#f9f9f9" }}
      InputProps={{
        readOnly: !editMode,
      }}
    >
      <MenuItem value="CSE">Computer Science</MenuItem>
      <MenuItem value="ECE">Electronics</MenuItem>
      <MenuItem value="ME">Mechanical</MenuItem>
      <MenuItem value="CE">Civil</MenuItem>
      <MenuItem value="EE">Electrical</MenuItem>
    </TextField>
  </Grid>
  <Grid item xs={12}>
    <TextField
      fullWidth
      label="Year"
      name="year"
      value={profile.year}
      onChange={handleChange}
      select
      variant="outlined"
      sx={{ backgroundColor: "#f9f9f9" }}
      InputProps={{
        readOnly: !editMode,
      }}
    >
      <MenuItem value="1">1st Year</MenuItem>
      <MenuItem value="2">2nd Year</MenuItem>
      <MenuItem value="3">3rd Year</MenuItem>
      <MenuItem value="4">4th Year</MenuItem>
    </TextField>
  </Grid>
</Grid>

        {editMode && (
          <Box sx={{ mt: 4, display: "flex", justifyContent: "flex-end", gap: 2 }}>
            <Button
              variant="outlined"
              size="large"
              onClick={handleCancel}
              startIcon={<Cancel />}
              disabled={loading.save}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              size="large"
              onClick={handleSave}
              disabled={loading.save}
              startIcon={loading.save ? <CircularProgress size={20} color="inherit" /> : <Save />}
            >
              {loading.save ? "Saving..." : "Save"}
            </Button>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default Profile;