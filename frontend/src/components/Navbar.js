import React from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AppBar, Toolbar, Typography, Button, Box, Container, Avatar, Menu, MenuItem, IconButton } from '@mui/material';
import { KeyboardArrowDown } from '@mui/icons-material';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = React.useState(null);

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

                <Box sx={{ display: 'flex', alignItems: 'center' }}>
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
    </AppBar>
  );
};

export default Navbar;
