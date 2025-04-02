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
import { jwtDecode } from 'jwt-decode';

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

const Login = () => {
  const [tabValue, setTabValue] = useState(0);
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const navigate = useNavigate();

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setLoginData({ email: '', password: '' });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLoginData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
  
    try {
      let endpoint = '';
      let redirectPath = '/';
      
      // Determine API endpoint based on selected tab
      switch(tabValue) {
        case 0: endpoint = '/api/students/login'; redirectPath = '/home'; break;
        case 1: endpoint = '/api/clubs/login'; redirectPath = '/clubhome'; break;
        case 2: endpoint = '/api/admin/login'; redirectPath = '/adminhome'; break;
        default: throw new Error('Invalid user type');
      }
  
      // Add client-side validation
      if (!loginData.email || !loginData.password) {
        throw new Error('Email and password are required');
      }
  
      console.log('Attempting login to:', endpoint, 'with:', loginData.email);
  
      const response = await axios.post(
        `http://localhost:5000${endpoint}`,
        loginData,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
  
      const { token } = response.data;
      const decodedToken = jwtDecode(token);
  
      // Store authentication data
      localStorage.setItem('token', token);
      localStorage.setItem('userId', decodedToken.id);
      localStorage.setItem('userRole', decodedToken.role);
      
      // For admin login, the response structure is different
      const userData = tabValue === 2 ? response.data.admin : 
                     tabValue === 1 ? response.data.club : 
                     response.data.student;
      
      localStorage.setItem('userData', JSON.stringify(userData));
  
      setSnackbar({
        open: true,
        message: `Login successful as ${decodedToken.role}!`,
        severity: 'success'
      });
  
      setTimeout(() => navigate(redirectPath), 1000);
  
    } catch (error) {
      console.error('Login error:', error);
      
      let errorMessage = error.response?.data?.message || 
                        error.message || 
                        'Login failed. Please try again.';
  
      // More specific error for admin login
      if (tabValue === 2 && error.response?.status === 400) {
        errorMessage = 'Admin login failed. Please check your credentials.';
      }
  
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Update demo credentials to exactly match your backend
  const demoAdminCredentials = {
    email: 'admin1@gmail.com', // Must match exactly
    password: 'admin123' // Must match exactly
  };
  const fillDemoAdmin = () => {
    if (tabValue === 2) {
      setLoginData(demoAdminCredentials);
    }
  };

  return (
    <Root>
      <Container component="main" maxWidth="sm">
        <StyledPaper elevation={3}>
          <Typography component="h1" variant="h5" align="center">
            Login
          </Typography>
          
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 2 }}>
            <Tabs value={tabValue} onChange={handleTabChange} centered>
              <Tab label="Student" />
              <Tab label="Club" />
              <Tab label="Admin" />
            </Tabs>
          </Box>

          <Form onSubmit={handleSubmit}>
            <Stack spacing={2} sx={{ mt: 3 }}>
              <TextField
                name="email"
                label="Email Address"
                variant="outlined"
                type="email"
                fullWidth
                required
                value={loginData.email}
                onChange={handleChange}
                autoComplete="email"
              />
              <TextField
                name="password"
                label="Password"
                variant="outlined"
                type="password"
                fullWidth
                required
                value={loginData.password}
                onChange={handleChange}
                autoComplete="current-password"
              />
            </Stack>
            
            {tabValue === 2 && (
              <Button
                fullWidth
                variant="outlined"
                color="secondary"
                onClick={fillDemoAdmin}
                sx={{ mt: 2, mb: 2 }}
              >
                Use Demo Admin Credentials
              </Button>
            )}
            
            <SubmitButton
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              disabled={loading}
              size="large"
            >
              {loading ? 'Logging in...' : 
               tabValue === 0 ? 'Login as Student' : 
               tabValue === 1 ? 'Login as Club' : 'Login as Admin'}
            </SubmitButton>

            {/* New Register Here Option */}
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Typography variant="body2">
                Don't have an account?{' '}
                <Button 
                  variant="text" 
                  color="primary" 
                  onClick={() => navigate('/signup')}
                >
                  Register Here
                </Button>
              </Typography>
            </Box>
          </Form>
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

export default Login;