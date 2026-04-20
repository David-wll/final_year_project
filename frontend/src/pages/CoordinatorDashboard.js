import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Box, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Button, Alert, CircularProgress,
  Chip, Grid, Avatar, Divider, Tooltip
} from '@mui/material';
import { WarningAmber, CheckCircle, Domain, Error as ErrorIcon, BarChart as ChartIcon, TrendingUp, AutoAwesome, CloudDownload } from '@mui/icons-material';
import api from '../services/api';
import { SimpleBarChart, SimplePieChart } from '../components/AnalyticsCharts';

const CoordinatorDashboard = () => {
  const [pendingOrgs, setPendingOrgs] = useState([]);
  const [atRiskPlacements, setAtRiskPlacements] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [scraping, setScraping] = useState(false);
  const [scrapeResults, setScrapeResults] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [orgsRes, riskRes, analyticsRes] = await Promise.all([
        api.get('organizations/coordinator/pending-orgs/'),
        api.get('supervision/coordinator/at-risk/'),
        api.get('recommendations/analytics/')
      ]);
      setPendingOrgs(orgsRes.data);
      setAtRiskPlacements(riskRes.data);
      setAnalytics(analyticsRes.data);
    } catch (err) {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (orgId, action) => {
    try {
      await api.patch(`organizations/coordinator/approve-org/${orgId}/`, { action });
      setSuccess(`Organization ${action === 'approve' ? 'approved' : 'rejected'} successfully!`);
      fetchDashboardData();
    } catch (err) {
      setError(`Failed to ${action} organization`);
    }
  };

  const handleScrape = async () => {
    setScraping(true);
    setScrapeResults(null);
    setError('');
    try {
      const res = await api.post('organizations/scrape/', { max_pages: 2 });
      setScrapeResults(res.data.results || {});
      const total = res.data.results?.total || {};
      setSuccess(`Scrape complete! Created ${total.created || 0} new listings, skipped ${total.skipped || 0} duplicates.`);
      fetchDashboardData(); // refresh analytics
    } catch (err) {
      setError('Scrape failed. Check server logs for details.');
    } finally {
      setScraping(false);
    }
  };

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
      <CircularProgress size={32} thickness={5} />
    </Box>
  );

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Box sx={{ mb: 6 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Coordinator Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Overview of system health, organization approvals, and student progress.
        </Typography>
      </Box>

      {/* Maintenance Section */}
      <Paper sx={{ p: 3, mb: 6, borderRadius: 3, bgcolor: 'rgba(17, 24, 39, 0.02)', border: '1px dashed rgba(17, 24, 39, 0.1)' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="subtitle1" fontWeight={700}>System Maintenance</Typography>
            <Typography variant="body2" color="text.secondary">Update the ML recommendation engine with recent placement data.</Typography>
          </Box>
          <Button
            variant="outlined"
            onClick={async () => {
              try {
                await api.post('recommendations/retrain/');
                setSuccess('AI Model retraining triggered successfully!');
              } catch (err) {
                setError('Failed to trigger retraining.');
              }
            }}
          >
            Retrain AI Model
          </Button>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="subtitle1" fontWeight={700}>Scrape Live Internship Data</Typography>
            <Typography variant="body2" color="text.secondary">
              Pull real internship listings from Nigerian job boards (MyJobMag, Jobberman, NGCareers) into the platform.
            </Typography>
          </Box>
          <Tooltip title="Scrapes up to 2 pages from each source. Takes ~1–2 minutes.">
            <span>
              <Button
                variant="contained"
                color="secondary"
                onClick={handleScrape}
                disabled={scraping}
                startIcon={scraping ? <CircularProgress size={16} color="inherit" /> : <CloudDownload />}
                sx={{ borderRadius: 2, fontWeight: 600 }}
              >
                {scraping ? 'Scraping…' : 'Scrape Live Data'}
              </Button>
            </span>
          </Tooltip>
        </Box>

        {scrapeResults && (
          <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {Object.entries(scrapeResults)
              .filter(([k]) => k !== 'total')
              .map(([source, stats]) => (
                <Chip
                  key={source}
                  size="small"
                  label={
                    stats.error
                      ? `${source}: error`
                      : `${source}: +${stats.created} new`
                  }
                  color={stats.error ? 'error' : 'success'}
                  variant="outlined"
                  sx={{ fontWeight: 600 }}
                />
              ))}
          </Box>
        )}
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 4, borderRadius: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 4, borderRadius: 2 }}>{success}</Alert>}

      {/* Stats Summary */}
      <Grid container spacing={3} sx={{ mb: 6 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, borderRadius: 4, height: '100%', bgcolor: 'primary.main', color: 'white' }}>
            <Typography variant="caption" sx={{ opacity: 0.8, fontWeight: 600, textTransform: 'uppercase' }}>
              Placement Success Rate
            </Typography>
            <Typography variant="h3" fontWeight={800} sx={{ mt: 1 }}>
              {analytics?.placement_stats?.success_rate || 0}%
            </Typography>
            <Typography variant="caption" sx={{ mt: 1, display: 'block', opacity: 0.8 }}>
              Based on {analytics?.placement_stats?.total || 0} completed internships
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, borderRadius: 4, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase' }}>
                  Pending Approvals
                </Typography>
                <Typography variant="h4" fontWeight={800} sx={{ mt: 1 }}>
                  {pendingOrgs.length}
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: 'rgba(17, 24, 39, 0.03)', color: 'primary.main' }}>
                <Domain />
              </Avatar>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, borderRadius: 4, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase' }}>
                  At-Risk Students
                </Typography>
                <Typography variant="h4" fontWeight={800} sx={{ mt: 1 }}>
                  {atRiskPlacements.length}
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: 'rgba(17, 24, 39, 0.03)', color: 'error.main' }}>
                <ErrorIcon color="error" />
              </Avatar>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, borderRadius: 4, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase' }}>
                  System Status
                </Typography>
                <Typography variant="h4" fontWeight={800} sx={{ mt: 1 }}>
                  Optimum
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: '#DCFCE7', color: '#166534' }}>
                <TrendingUp />
              </Avatar>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Analytics Charts */}
      <Grid container spacing={4} sx={{ mb: 8 }}>
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 4, borderRadius: 4, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
              <Box>
                <Typography variant="h6" fontWeight={700}>Skill Demand Trends</Typography>
                <Typography variant="caption" color="text.secondary">Top 10 technical skills requested by organizations</Typography>
              </Box>
              <ChartIcon color="action" />
            </Box>
            <SimpleBarChart
              data={analytics?.top_skills || []}
              xKey="name"
              yKey="count"
              color="#3B82F6"
            />
          </Paper>
        </Grid>
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 4, borderRadius: 4, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
              <Box>
                <Typography variant="h6" fontWeight={700}>Sector Distribution</Typography>
                <Typography variant="caption" color="text.secondary">Internship opportunities by industry</Typography>
              </Box>
              <AutoAwesome color="action" />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <SimplePieChart
                data={analytics?.sector_distribution || []}
                valueKey="count"
                labelKey="sector"
              />
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* At-Risk Section */}
      <Box sx={{ mb: 8 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 1 }}>
          <WarningAmber color="error" />
          <Typography variant="h6" fontWeight={600}>At-Risk Internships</Typography>
        </Box>
        <TableContainer component={Paper} sx={{ borderRadius: 3, overflow: 'hidden' }}>
          <Table>
            <TableHead sx={{ backgroundColor: 'rgba(17, 24, 39, 0.02)' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Student</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Organization</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Avg Rating</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Reports</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {atRiskPlacements.map((p) => (
                <TableRow key={p.id} hover>
                  <TableCell sx={{ py: 2.5 }}>
                    <Typography variant="subtitle2" fontWeight={600}>
                      {p.application_details?.student_details?.full_name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {p.application_details?.student_details?.matric_number}
                    </Typography>
                  </TableCell>
                  <TableCell>{p.application_details?.opportunity_details?.organization_name}</TableCell>
                  <TableCell>
                    <Chip
                      label={p.avg_rating || 'N/A'}
                      size="small"
                      color={p.avg_rating && p.avg_rating < 2.5 ? 'error' : 'warning'}
                      sx={{ fontWeight: 700, borderRadius: 1.5 }}
                    />
                  </TableCell>
                  <TableCell>{p.report_count} submitted</TableCell>
                  <TableCell align="right">
                    <Button size="small" variant="text">Contact Student</Button>
                  </TableCell>
                </TableRow>
              ))}
              {atRiskPlacements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                    <CheckCircle sx={{ color: 'success.main', mb: 1, display: 'block', mx: 'auto' }} />
                    <Typography color="text.secondary">No students currently flagged as at-risk.</Typography>
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Pending Approvals */}
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 1 }}>
          <Domain color="primary" />
          <Typography variant="h6" fontWeight={600}>Pending Organization Approvals</Typography>
        </Box>
        <TableContainer component={Paper} sx={{ borderRadius: 3, overflow: 'hidden' }}>
          <Table>
            <TableHead sx={{ backgroundColor: 'rgba(17, 24, 39, 0.02)' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Company Name</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Sector</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Contact Person</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pendingOrgs.map((org) => (
                <TableRow key={org.id} hover>
                  <TableCell sx={{ py: 2.5 }}>
                    <Typography variant="subtitle2" fontWeight={600}>{org.company_name}</Typography>
                    <Typography variant="caption" color="text.secondary">Reg: {org.registration_number}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={org.industry_sector} size="small" variant="outlined" sx={{ borderRadius: 1.5 }} />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{org.contact_person_name}</Typography>
                    <Typography variant="caption" color="text.secondary">{org.contact_phone}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                      <Button
                        variant="contained" size="small"
                        onClick={() => handleAction(org.id, 'approve')}
                        sx={{ borderRadius: 1.5, px: 2 }}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="outlined" color="error" size="small"
                        onClick={() => handleAction(org.id, 'reject')}
                        sx={{ borderRadius: 1.5 }}
                      >
                        Reject
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
              {pendingOrgs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">No pending organization approvals.</Typography>
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Container>
  );
};

export default CoordinatorDashboard;
