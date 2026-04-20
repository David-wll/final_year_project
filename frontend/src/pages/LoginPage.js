import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Container, TextField, Button, Typography, Box, Alert, Paper } from '@mui/material';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { user, login, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError('Invalid email or password');
    }
  };

  return (
    <Container maxWidth={false} disableGutters sx={{ height: 'calc(100vh - 64px)', display: 'flex' }}>
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          px: 4,
          backgroundColor: 'background.paper',
        }}
      >
        <Box sx={{ maxWidth: 400, width: '100%' }}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" gutterBottom>
              Welcome back
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Enter your credentials to access your account
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" fontWeight={500} sx={{ mb: 1 }}>
                Email address
              </Typography>
              <TextField
                fullWidth
                id="email"
                name="email"
                autoComplete="email"
                autoFocus
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Box>
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" fontWeight={500}>
                  Password
                </Typography>
              </Box>
              <TextField
                fullWidth
                name="password"
                type="password"
                id="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Box>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ py: 1.2, mb: 3, borderRadius: 2 }}
            >
              Sign in
            </Button>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Don't have an account?{' '}
                <Link to="/register" style={{ color: '#111827', fontWeight: 600, textDecoration: 'none' }}>
                  Sign up
                </Link>
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
      <Box
        sx={{
          flex: 1.2,
          backgroundColor: '#F3F4F6',
          display: { xs: 'none', md: 'flex' },
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Abstract design elements */}
        <Box
          sx={{
            width: '80%',
            height: '60%',
            backgroundColor: '#FFFFFF',
            borderRadius: 4,
            boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.05)',
            p: 4,
            zIndex: 1,
          }}
        >
          <Box sx={{ width: '40%', height: 12, backgroundColor: '#E5E7EB', borderRadius: 1, mb: 2 }} />
          <Box sx={{ width: '80%', height: 12, backgroundColor: '#F3F4F6', borderRadius: 1, mb: 4 }} />
          <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
            <Box sx={{ flex: 1, height: 100, backgroundColor: '#F9FAFB', borderRadius: 2 }} />
            <Box sx={{ flex: 1, height: 100, backgroundColor: '#F9FAFB', borderRadius: 2 }} />
            <Box sx={{ flex: 1, height: 100, backgroundColor: '#F9FAFB', borderRadius: 2 }} />
          </Box>
          <Box sx={{ width: '60%', height: 12, backgroundColor: '#F3F4F6', borderRadius: 1, mb: 2 }} />
          <Box sx={{ width: '90%', height: 12, backgroundColor: '#F3F4F6', borderRadius: 1 }} />
        </Box>
        <Box
          sx={{
            position: 'absolute',
            top: '10%',
            right: '-10%',
            width: 300,
            height: 300,
            borderRadius: '50%',
            backgroundColor: 'rgba(17, 24, 39, 0.03)',
          }}
        />
      </Box>
    </Container>
  );
};

export default LoginPage;
