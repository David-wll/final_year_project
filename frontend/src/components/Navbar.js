import React, { useState, useEffect } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  AppBar, Toolbar, Typography, Button, Box, Container, 
  Avatar, Menu, MenuItem, IconButton, Badge, Popover,
  List, ListItem, ListItemText, Divider, CircularProgress
} from '@mui/material';
import { KeyboardArrowDown, NotificationsNone, NotificationsActive } from '@mui/icons-material';
import api from '../services/api';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifAnchor, setNotifAnchor] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('auth/notifications/');
      setNotifications(res.data);
    } catch (err) {
      console.error('Failed to fetch notifications');
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await api.post(`auth/notifications/${id}/read/`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error('Failed to mark read');
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleClose();
    logout();
    navigate('/login');
  };

  return (
    <AppBar position="sticky" elevation={0}>
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ height: 64 }}>
          <Typography
            variant="h6"
            component={RouterLink}
            to="/"
            sx={{
              flexGrow: 1,
              textDecoration: 'none',
              color: 'primary.main',
              fontWeight: 700,
              letterSpacing: '-0.02em',
            }}
          >
            Internship
          </Typography>

          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {user ? (
              <>
                <Box sx={{ display: 'flex', gap: 0.5, mr: 2 }}>
                  {user.role === 'student' && (
                    <>
                      <Button color="inherit" component={RouterLink} to="/discovery" sx={{ fontSize: '0.9rem' }}>
                        Discover
                      </Button>
                      <Button color="inherit" component={RouterLink} to="/reports" sx={{ fontSize: '0.9rem' }}>
                        Reports
                      </Button>
                    </>
                  )}
                  {user.role === 'organization' && (
                    <Button color="inherit" component={RouterLink} to="/dashboard" sx={{ fontSize: '0.9rem' }}>
                      Dashboard
                    </Button>
                  )}
                  {user.role === 'coordinator' && (
                    <Button color="inherit" component={RouterLink} to="/coordinator" sx={{ fontSize: '0.9rem' }}>
                      Coordinator
                    </Button>
                  )}
                  {user.role === 'supervisor' && (
                    <Button color="inherit" component={RouterLink} to="/supervisor" sx={{ fontSize: '0.9rem' }}>
                      Supervisor
                    </Button>
                  )}
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <IconButton 
                    onClick={(e) => setNotifAnchor(e.currentTarget)}
                    sx={{ color: 'text.secondary' }}
                  >
                    <Badge badgeContent={unreadCount} color="error">
                      {unreadCount > 0 ? <NotificationsActive /> : <NotificationsNone />}
                    </Badge>
                  </IconButton>

                  <IconButton
                    onClick={handleMenu}
                    sx={{ p: 0.5, borderRadius: 2, '&:hover': { backgroundColor: 'background.default' } }}
                  >
                    <Avatar sx={{ width: 32, height: 32, fontSize: '0.9rem', bgcolor: 'primary.main' }}>
                      {user.email[0].toUpperCase()}
                    </Avatar>
                    <KeyboardArrowDown sx={{ fontSize: 18, ml: 0.5, color: 'text.secondary' }} />
                  </IconButton>
                  <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleClose}
                    transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                    anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                    PaperProps={{
                      elevation: 0,
                      sx: {
                        mt: 1,
                        minWidth: 180,
                        border: '1px solid #E5E7EB',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      },
                    }}
                  >
                    <Box sx={{ px: 2, py: 1.5 }}>
                      <Typography variant="subtitle2" noWrap>
                        {user.email}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                        {user.role}
                      </Typography>
                    </Box>
                    <MenuItem divider />
                    {user.role === 'student' && (
                      <MenuItem component={RouterLink} to="/profile" onClick={handleClose}>
                        My Profile
                      </MenuItem>
                    )}
                    <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                      Logout
                    </MenuItem>
                  </Menu>
                </Box>
              </>
            ) : (
              <>
                <Button color="inherit" component={RouterLink} to="/login" sx={{ fontSize: '0.9rem' }}>
                  Sign in
                </Button>
                <Button
                  variant="contained"
                  component={RouterLink}
                  to="/register"
                  sx={{ borderRadius: 2, px: 2, py: 0.8, fontSize: '0.85rem' }}
                >
                  Get started
                </Button>
              </>
            )}
          </Box>
        </Toolbar>
      </Container>

      {/* Notifications Popover */}
      <Popover
        open={Boolean(notifAnchor)}
        anchorEl={notifAnchor}
        onClose={() => setNotifAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{ sx: { width: 320, maxHeight: 400, borderRadius: 3, mt: 1 } }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle2" fontWeight={800}>Notifications</Typography>
          {unreadCount > 0 && <Typography variant="caption" color="primary" sx={{ cursor: 'pointer' }}>Mark all as read</Typography>}
        </Box>
        <Divider />
        <List sx={{ p: 0 }}>
          {notifications.length > 0 ? (
            notifications.map((n) => (
              <ListItem 
                key={n.id} 
                sx={{ 
                  bgcolor: n.is_read ? 'transparent' : 'rgba(59, 130, 246, 0.04)',
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' }
                }}
                onClick={() => handleMarkRead(n.id)}
              >
                <ListItemText
                  primary={n.title}
                  secondary={n.message}
                  primaryTypographyProps={{ variant: 'body2', fontWeight: n.is_read ? 500 : 800 }}
                  secondaryTypographyProps={{ variant: 'caption', sx: { display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' } }}
                />
              </ListItem>
            ))
          ) : (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">No notifications yet.</Typography>
            </Box>
          )}
        </List>
      </Popover>
    </AppBar>
  );
};

export default Navbar;
