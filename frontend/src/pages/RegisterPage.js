import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Container, TextField, Button, Typography, Box, Alert, Grid } from '@mui/material';

const RegisterPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');
  const { user, register, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await register(email, password, role);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.email?.[0] || 'Registration failed');
    }
  };

  const roles = [
    { value: 'student', label: 'Student', description: 'Find internship opportunities' },
    { value: 'organization', label: 'Organization', description: 'Post and manage internships' },
    { value: 'coordinator', label: 'Coordinator', description: 'Approve and oversee SIWES' },
    { value: 'supervisor', label: 'Supervisor', description: 'Evaluate student progress' },
  ];

  return (
    <Container maxWidth={false} disableGutters sx={{ minHeight: 'calc(100vh - 64px)', display: 'flex' }}>
      <Box
        sx={{
          flex: 1.2,
          backgroundColor: '#F3F4F6',
          display: { xs: 'none', lg: 'flex' },
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
          overflow: 'hidden',
          p: 6,
        }}
      >
        <Box sx={{ maxWidth: 500, zIndex: 1 }}>
          <Typography variant="h3" fontWeight={700} gutterBottom sx={{ letterSpacing: '-0.03em', color: 'primary.main' }}>
            Elevate your SIWES experience.
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 6, fontWeight: 400, lineHeight: 1.6 }}>
            The modern platform connecting Nigeria's brightest students with top-tier organizations for seamless internship placements.
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
            {[
              { title: 'Smart Matching', desc: 'AI-driven recommendations' },
              { title: 'Digital Logbook', desc: 'Real-time progress tracking' },
              { title: 'Quick Approval', desc: 'Automated verification' },
              { title: 'Verified Orgs', desc: 'Industry-standard partners' },
            ].map((feature, i) => (
              <Box key={i}>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  {feature.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {feature.desc}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          px: 4,
          py: 8,
          backgroundColor: 'background.paper',
        }}
      >
        <Box sx={{ maxWidth: 440, width: '100%' }}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" gutterBottom>
              Create an account
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Join thousands of students and organizations today
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
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" fontWeight={500} sx={{ mb: 1 }}>
                Password
              </Typography>
              <TextField
                fullWidth
                type="password"
                id="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Box>
            <Box sx={{ mb: 4 }}>
              <Typography variant="body2" fontWeight={500} sx={{ mb: 1 }}>
                I am a...
              </Typography>
              <Grid container spacing={1.5}>
                {roles.map((r) => (
                  <Grid item xs={6} key={r.value}>
                    <Box
                      onClick={() => setRole(r.value)}
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: role === r.value ? 'primary.main' : 'divider',
                        backgroundColor: role === r.value ? 'rgba(17, 24, 39, 0.02)' : 'transparent',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': {
                          borderColor: 'primary.main',
                          backgroundColor: 'rgba(17, 24, 39, 0.02)',
                        },
                      }}
                    >
                      <Typography variant="subtitle2" fontWeight={600} color={role === r.value ? 'primary.main' : 'text.primary'}>
                        {r.label}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        {r.description}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Box>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ py: 1.2, mb: 3, borderRadius: 2 }}
            >
              Create account
            </Button>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Already have an account?{' '}
                <Link to="/login" style={{ color: '#111827', fontWeight: 600, textDecoration: 'none' }}>
                  Sign in
                </Link>
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Container>
  );
};

export default RegisterPage;
