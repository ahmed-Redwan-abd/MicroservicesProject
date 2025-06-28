import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Users from '../components/Users';
import DailyVisits from '../components/DailyVisits';

import {
  Box,
  CssBaseline,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Button,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import PharmacyIcon from '@mui/icons-material/LocalPharmacy';
import LogoutIcon from '@mui/icons-material/Logout';

const drawerWidth = 240;

// Simple JWT decode function
function parseJwt(token) {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    return null;
  }
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState(null);
  const [role, setRole] = useState(null); // NEW: Role state
  const [activePage, setActivePage] = useState('dashboard');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/', { replace: true });
    } else {
      const decoded = parseJwt(token);
      if (decoded && decoded.username && decoded.id) {
        setUsername(decoded.username);
        setRole(decoded.role); // Save role if available
        setIsAuthenticated(true);
      } else {
        localStorage.removeItem('token');
        navigate('/', { replace: true });
      }
    }
    setLoading(false);
  }, [navigate]);

  if (loading || !isAuthenticated) return null;

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  const drawer = (
    <div>
      <Toolbar />
      <Divider />
      <List>
      <ListItem button onClick={() => setActivePage('dashboard')}>
  <ListItemIcon><DashboardIcon /></ListItemIcon>
  <ListItemText primary="Dashboard" />
</ListItem>

        {/* Only show Users if role is admin or manager */}
        {console.log(role)}
        {(role === 'admin' || role === 'manager') && (
           <ListItem button onClick={() => setActivePage('users')}>
            <ListItemIcon><PeopleIcon /></ListItemIcon>
            <ListItemText primary="Users" />
            </ListItem>
        )}

        <ListItem button onClick={() => setActivePage('dailyVisits')}>
          <ListItemIcon><PeopleIcon /></ListItemIcon>
          <ListItemText primary="Patients" />
        </ListItem>

        {(role === 'pharmacist' || role === 'manager') &&(<ListItem button onClick={() => alert('Go to Pharmacy')}>
          <ListItemIcon><PharmacyIcon /></ListItemIcon>
          <ListItemText primary="Pharmacy" />
        </ListItem>)}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          <Typography variant="h6" noWrap component="div">
            Dashboard
          </Typography>

          <Button
            color="inherit"
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      {/* Drawer - sidebar menu */}
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="mailbox folders"
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>

        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: 8,
        }}
      >
        {activePage === 'dashboard' && (
  <Typography variant="h4" gutterBottom>
    {username ? `Welcome, ${username}!` : 'Welcome!'}
  </Typography>
)}

{activePage === 'users' && (role === 'admin' || role === 'manager') && (
  <Users />
)}

{activePage === 'dailyVisits' && (
  <DailyVisits />
)}

      </Box>
    </Box>
  );
}
