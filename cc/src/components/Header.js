import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { 
  Avatar,
  Menu,
  MenuItem,
  Button,
  Box,
  Typography,
  CircularProgress
} from '@mui/material';

const Navbar = () => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [userInitial, setUserInitial] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuthStatus = () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const decoded = jwtDecode(token);
          const name = decoded.name || decoded.email || 'User';
          setUserInitial(name.charAt(0).toUpperCase());
          setIsLoggedIn(true);
        } catch (error) {
          console.error('Token decode error:', error);
          handleLogout();
        }
      }
      setLoading(false);
    };

    checkAuthStatus();

    // Listen for storage events to handle logout from other tabs
    const handleStorageChange = (e) => {
      if (e.key === 'token') {
        checkAuthStatus();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleMenuClose();
    try {
      await axios.post('http://localhost:5000/api/auth/logout', {}, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      setIsLoggedIn(false);
      setUserInitial('');
      navigate('/login');
      window.location.reload(); // Force refresh to reset all states
    }
  };

  const handleProfileClick = () => {
    handleMenuClose();
    navigate('/profile');
  };

  const handleLoginClick = () => {
    navigate('/login');
  };

  const navbarStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#3498db',
    padding: '10px 20px',
    boxShadow: '0 2px 5px rgba(0, 0, 0, 0.2)',
  };

  const logoStyle = {
    fontSize: '24px',
    color: 'white',
    textDecoration: 'none',
    cursor: 'pointer',
  };

  const linksContainerStyle = {
    display: 'flex',
    gap: '15px',
    alignItems: 'center',
  };

  const linkStyle = {
    color: 'white',
    textDecoration: 'none',
    padding: '10px 15px',
    borderRadius: '4px',
    transition: 'background-color 0.3s',
    '&:hover': {
      backgroundColor: '#2980b9',
    }
  };

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: '#3498db',
        padding: '10px 20px'
      }}>
        <CircularProgress size={24} color="inherit" />
      </Box>
    );
  }

  return (
    <nav style={navbarStyle}>
      <Link to="/" style={logoStyle}>Campus Connect</Link>
      <div style={linksContainerStyle}>
        {isLoggedIn && (
          <>
            <Link to="/home" style={linkStyle}>Home</Link>
            <Link to="/purchased" style={linkStyle}>Purchased</Link>
            <Link to="/clubs" style={linkStyle}>Clubs</Link>
          </>
        )}
        
        {isLoggedIn ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <Avatar 
              sx={{ 
                bgcolor: 'white', 
                color: '#3498db',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
              onClick={handleMenuOpen}
            >
              {userInitial}
            </Avatar>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              PaperProps={{
                elevation: 0,
                sx: {
                  overflow: 'visible',
                  filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                  mt: 1.5,
                  '& .MuiAvatar-root': {
                    width: 32,
                    height: 32,
                    ml: -0.5,
                    mr: 1,
                  },
                },
              }}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <MenuItem onClick={handleProfileClick}>
                <Typography>Profile</Typography>
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                <Typography color="error">Logout</Typography>
              </MenuItem>
            </Menu>
          </Box>
        ) : (
          <Button 
            variant="contained" 
            color="secondary"
            onClick={handleLoginClick}
            sx={{
              backgroundColor: 'white',
              color: '#3498db',
              '&:hover': {
                backgroundColor: '#f0f0f0',
              }
            }}
          >
            Login
          </Button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;