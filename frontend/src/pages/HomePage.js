import React from 'react';
import { Link as RouterLink, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Container, Typography, Box, Button, Grid, Paper, Stack 
} from '@mui/material';
import { 
  ArrowForward, 
  AutoAwesome, 
  Timeline, 
  VerifiedUser, 
  BusinessCenter 
} from '@mui/icons-material';

const HomePage = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return null; // Or a loading spinner
  }

  if (user) {
    // Redirect authenticated users to their primary dashboard/page
    switch (user.role) {
      case 'student':
        return <Navigate to="/discovery" />;
      case 'organization':
        return <Navigate to="/dashboard" />;
      case 'coordinator':
        return <Navigate to="/coordinator" />;
      case 'supervisor':
        return <Navigate to="/supervisor" />;
      default:
        return <Navigate to="/login" />;
    }
  }

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      {/* Hero Section */}
      <Box 
        sx={{ 
          pt: { xs: 10, md: 15 }, 
          pb: { xs: 8, md: 12 },
          background: 'radial-gradient(circle at 50% -20%, #F3F4F6 0%, #F9FAFB 100%)',
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Container maxWidth="lg">
          <Stack spacing={4} alignItems="center" textAlign="center">
            <Box 
              sx={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: 1, 
                px: 2, 
                py: 0.5, 
                borderRadius: 5, 
                bgcolor: 'rgba(17, 24, 39, 0.05)',
                border: '1px solid rgba(17, 24, 39, 0.1)'
              }}
            >
              <AutoAwesome sx={{ fontSize: 16, color: 'primary.main' }} />
              <Typography variant="caption" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                The Future of SIWES in Nigeria
              </Typography>
            </Box>
            
            <Typography 
              variant="h2" 
              sx={{ 
                fontWeight: 800, 
                letterSpacing: '-0.04em', 
                lineHeight: 1.1,
                maxWidth: 800,
                fontSize: { xs: '2.5rem', md: '4rem' }
              }}
            >
              Bridge the gap between <Box component="span" sx={{ color: 'text.secondary' }}>education</Box> and <Box component="span" sx={{ borderBottom: '4px solid #111827' }}>industry.</Box>
            </Typography>
            
            <Typography 
              variant="h6" 
              color="text.secondary" 
              sx={{ maxWidth: 600, fontWeight: 400, lineHeight: 1.6 }}
            >
              The intelligent internship system designed for Nigerian students, 
              organizations, and university coordinators to streamline SIWES placements.
            </Typography>
            
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 2 }}>
              <Button 
                variant="contained" 
                size="large" 
                component={RouterLink} 
                to="/register"
                endIcon={<ArrowForward />}
                sx={{ px: 4, py: 1.5, borderRadius: 2 }}
              >
                Join as Student
              </Button>
              <Button 
                variant="outlined" 
                size="large" 
                component={RouterLink} 
                to="/register"
                sx={{ px: 4, py: 1.5, borderRadius: 2 }}
              >
                For Organizations
              </Button>
            </Stack>
          </Stack>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 12 }}>
        <Grid container spacing={4}>
          {[
            {
              title: 'Smart Matching',
              desc: 'AI-driven recommendations based on your skills, CGPA, and career aspirations.',
              icon: <AutoAwesome color="primary" />,
            },
            {
              title: 'Digital Logbook',
              desc: 'Submit weekly reports and track your progress in real-time without the paperwork.',
              icon: <Timeline color="primary" />,
            },
            {
              title: 'Verified Placements',
              desc: 'Access a curated list of industry-standard organizations approved by university coordinators.',
              icon: <VerifiedUser color="primary" />,
            },
            {
              title: 'Career Discovery',
              desc: 'Explore diverse sectors from FinTech to Agriculture tailored to your field of study.',
              icon: <BusinessCenter color="primary" />,
            }
          ].map((feature, i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 4, 
                  height: '100%', 
                  borderRadius: 4, 
                  border: '1px solid', 
                  borderColor: 'divider',
                  transition: 'all 0.2s',
                  '&:hover': {
                    borderColor: 'primary.main',
                    transform: 'translateY(-4px)'
                  }
                }}
              >
                <Box sx={{ mb: 2 }}>{feature.icon}</Box>
                <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                  {feature.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" lineHeight={1.6}>
                  {feature.desc}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Social Proof / Call to Action */}
      <Box sx={{ bgcolor: 'primary.main', py: 10, color: 'white' }}>
        <Container maxWidth="md">
          <Stack spacing={4} alignItems="center" textAlign="center">
            <Typography variant="h4" fontWeight={700} letterSpacing="-0.02em">
              Ready to start your professional journey?
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.8, maxWidth: 500 }}>
              Join thousands of Nigerian students who have found their dream 
              internships through our intelligent matching system.
            </Typography>
            <Button 
              variant="contained" 
              size="large" 
              component={RouterLink} 
              to="/register"
              sx={{ 
                bgcolor: 'white', 
                color: 'primary.main',
                px: 6,
                py: 2,
                borderRadius: 2,
                fontWeight: 700,
                '&:hover': {
                  bgcolor: '#F3F4F6'
                }
              }}
            >
              Create Free Account
            </Button>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
};

export default HomePage;
