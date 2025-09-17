import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  TextField,
  Button,
  Paper,
  Stack,
  Snackbar,
  Alert
} from '@mui/material';
import { styled } from '@mui/system';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../config/api';

const Root = styled('div')({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '100vh',
});

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  width: '100%',
  maxWidth: 500,
}));

const Form = styled('form')(({ theme }) => ({
  marginTop: theme.spacing(3),
  width: '100%'
}));

const SubmitButton = styled(Button)(({ theme }) => ({
  margin: theme.spacing(3, 0, 2),
}));

const Signup = () => {
  const navigate = useNavigate();

  const [tabValue, setTabValue] = useState(0);
  const [studentData, setStudentData] = useState({
    name: '',
    email: '',
    course: '',
    password: ''
  });
  const [clubData, setClubData] = useState({
    name: '',
    email: '',
    description: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const handleTabChange = (_e, newValue) => setTabValue(newValue);

  const handleStudentChange = (e) => {
    const { name, value } = e.target;
    setStudentData((prev) => ({ ...prev, [name]: value }));
  };

  const handleClubChange = (e) => {
    const { name, value } = e.target;
    setClubData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCloseSnackbar = () =>
    setSnackbar((prev) => ({ ...prev, open: false }));

  // --- Helpers ---
  const showError = (err) => {
    const msg =
      err?.response?.data?.message ||
      err?.message ||
      'Request failed. Please try again.';
    setSnackbar({ open: true, message: msg, severity: 'error' });
  };

  const showSuccess = (msg) =>
    setSnackbar({ open: true, message: msg, severity: 'success' });

  // --- Submit handlers ---
 const handleStudentSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  try {
    console.log('API_BASE_URL =', API_BASE_URL); // should print http://localhost:30800
    await axios.post(`${API_BASE_URL}/api/students/signup`, studentData);
    showSuccess('Student registration successful!');
    setStudentData({ name: '', email: '', course: '', password: '' });
    navigate('/login');
  } catch (err) {
    console.error('Student signup error:', err?.response?.data || err);
    showError(err);
  } finally {
    setLoading(false);
  }
};

const handleClubSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  try {
    await axios.post(`${API_BASE_URL}/api/clubs/signup`, clubData);
    showSuccess('Club registration successful!');
    setClubData({ name: '', email: '', description: '', password: '' });
    navigate('/login');
  } catch (err) {
    console.error('Club signup error:', err?.response?.data || err);
    showError(err);
  } finally {
    setLoading(false);
  }
};


  const studentDisabled =
    !studentData.name || !studentData.email || !studentData.course || !studentData.password || loading;

  const clubDisabled =
    !clubData.name || !clubData.email || !clubData.password || loading;

  return (
    <Root>
      <Container component="main" maxWidth="sm">
        <StyledPaper elevation={3}>
          <Typography component="h1" variant="h5" align="center">
            Sign Up
          </Typography>

          <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 2 }}>
            <Tabs value={tabValue} onChange={handleTabChange} centered>
              <Tab label="Student" />
              <Tab label="Club" />
            </Tabs>
          </Box>

          {tabValue === 0 && (
            <Form onSubmit={handleStudentSubmit}>
              <Stack spacing={2}>
                <TextField
                  name="name"
                  label="Full Name"
                  variant="outlined"
                  fullWidth
                  required
                  value={studentData.name}
                  onChange={handleStudentChange}
                />
                <TextField
                  name="email"
                  label="Email Address"
                  variant="outlined"
                  type="email"
                  fullWidth
                  required
                  value={studentData.email}
                  onChange={handleStudentChange}
                />
                <TextField
                  name="course"
                  label="Course/Program"
                  variant="outlined"
                  fullWidth
                  required
                  value={studentData.course}
                  onChange={handleStudentChange}
                />
                <TextField
                  name="password"
                  label="Password"
                  variant="outlined"
                  type="password"
                  fullWidth
                  required
                  value={studentData.password}
                  onChange={handleStudentChange}
                />
              </Stack>
              <SubmitButton
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                disabled={studentDisabled}
              >
                {loading ? 'Processing...' : 'Sign Up as Student'}
              </SubmitButton>
            </Form>
          )}

          {tabValue === 1 && (
            <Form onSubmit={handleClubSubmit}>
              <Stack spacing={2}>
                <TextField
                  name="name"
                  label="Club Name"
                  variant="outlined"
                  fullWidth
                  required
                  value={clubData.name}
                  onChange={handleClubChange}
                />
                <TextField
                  name="email"
                  label="Email Address"
                  variant="outlined"
                  type="email"
                  fullWidth
                  required
                  value={clubData.email}
                  onChange={handleClubChange}
                />
                <TextField
                  name="description"
                  label="Club Description"
                  variant="outlined"
                  fullWidth
                  multiline
                  rows={3}
                  value={clubData.description}
                  onChange={handleClubChange}
                />
                <TextField
                  name="password"
                  label="Password"
                  variant="outlined"
                  type="password"
                  fullWidth
                  required
                  value={clubData.password}
                  onChange={handleClubChange}
                />
              </Stack>
              <SubmitButton
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                disabled={clubDisabled}
              >
                {loading ? 'Processing...' : 'Sign Up as Club'}
              </SubmitButton>
            </Form>
          )}

          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Typography variant="body2">
              Already have an account?{' '}
              <Button
                variant="text"
                color="primary"
                onClick={() => navigate('/login')}
              >
                Login
              </Button>
            </Typography>
          </Box>
        </StyledPaper>
      </Container>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Root>
  );
};

export default Signup;
