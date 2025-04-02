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
import { useNavigate } from 'react-router-dom'; // Import useNavigate

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
  const navigate = useNavigate(); // Initialize useNavigate
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

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleStudentChange = (e) => {
    const { name, value } = e.target;
    setStudentData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleClubChange = (e) => {
    const { name, value } = e.target;
    setClubData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handleStudentSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await axios.post('http://localhost:5000/api/students/signup', studentData);
      console.log('Signup successful:', response.data);
      setSnackbar({
        open: true,
        message: 'Student registration successful!',
        severity: 'success'
      });
      setStudentData({
        name: '',
        email: '',
        course: '',
        password: ''
      });
      navigate('/login'); // Redirect to /login after successful signup
    } catch (error) {
      console.error('Signup error:', error.response?.data || error.message);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Registration failed. Please try again.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClubSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await axios.post('http://localhost:5000/api/clubs/signup', clubData);
      console.log('Signup successful:', response.data);
      setSnackbar({
        open: true,
        message: 'Club registration successful!',
        severity: 'success'
      });
      setClubData({
        name: '',
        email: '',
        description: '',
        password: ''
      });
      navigate('/login'); // Redirect to /login after successful signup
    } catch (error) {
      console.error('Signup error:', error.response?.data || error.message);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Registration failed. Please try again.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

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
                disabled={loading}
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
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Sign Up as Club'}
              </SubmitButton>
            </Form>
          )}

          {/* Already have an account? Login */}
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