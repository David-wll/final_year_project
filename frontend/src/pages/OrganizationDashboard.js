import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Box, Paper, Grid, TextField, Button,
  Alert, CircularProgress, Divider, List,
  ListItem, ListItemText, ListItemSecondaryAction, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, MenuItem, Chip
} from '@mui/material';
import { Delete, Edit, Add, People, Business, LocationOn, Phone, Email, Verified } from '@mui/icons-material';
import api from '../services/api';

const OrganizationDashboard = () => {
  const [profile, setProfile] = useState(null);
  const [opportunities, setOpportunities] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [openApplicants, setOpenApplicants] = useState(false);
  const [selectedOppApplicants, setSelectedOppApplicants] = useState([]);
  const [taxonomy, setTaxonomy] = useState({ technical_skills: [], sectors: [], locations: [] });

  const [oppFormData, setOppFormData] = useState({
    title: '',
    description: '',
    required_technical_skills: [],
    required_soft_skills: [],
    sector: '',
    location_state: '',
    location_lga: '',
    duration_weeks: 12,
    start_date: '',
    application_deadline: '',
    slots_available: 1,
    stipend_available: false,
    stipend_amount: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [profileRes, oppsRes, appsRes, taxRes] = await Promise.all([
        api.get('organizations/profile/'),
        api.get('organizations/opportunities/'),
        api.get('placements/organization/applications/'),
        api.get('students/taxonomy/')
      ]);
      setProfile(profileRes.data);
      setOpportunities(oppsRes.data);
      setApplications(appsRes.data);
      setTaxonomy(taxRes.data);
    } catch (err) {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleProfileUpdate = async () => {
    try {
      await api.put('organizations/profile/', profile);
      setSuccess('Profile updated successfully!');
    } catch (err) {
      setError('Failed to update profile');
    }
  };

  const handleOppChange = (e) => {
    const { name, value, type, checked } = e.target;
    setOppFormData({ ...oppFormData, [name]: type === 'checkbox' ? checked : value });
  };

  const handlePostOpportunity = async () => {
    try {
      await api.post('organizations/opportunities/', oppFormData);
      setSuccess('Opportunity posted successfully!');
      setOpenDialog(false);
      fetchData();
    } catch (err) {
      setError('Failed to post opportunity');
    }
  };

  const handleViewApplicants = (oppId) => {
    const oppApps = applications.filter(app => app.opportunity === oppId);
    setSelectedOppApplicants(oppApps);
    setOpenApplicants(true);
  };

  const handleStatusUpdate = async (appId, newStatus) => {
    try {
      await api.patch(`placements/applications/${appId}/status/`, { status: newStatus });
      setSuccess('Status updated successfully!');
      fetchData();
      setSelectedOppApplicants(prev => prev.map(app =>
        app.id === appId ? { ...app, status: newStatus } : app
      ));
    } catch (err) {
      setError('Failed to update status');
    }
  };

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
      <CircularProgress size={32} thickness={5} />
    </Box>
  );

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Box sx={{ mb: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {profile.company_name} {profile.verified && <Verified color="primary" sx={{ fontSize: 28 }} />}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your internship postings and review candidates.
          </Typography>
        </Box>
        <Chip
          label={profile.itf_approval_status.toUpperCase()}
          color={profile.itf_approval_status === 'approved' ? 'success' : 'warning'}
          sx={{ fontWeight: 700, borderRadius: 2 }}
        />
      </Box>

      {error && <Alert severity="error" sx={{ mb: 4, borderRadius: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 4, borderRadius: 2 }}>{success}</Alert>}

      <Grid container spacing={4}>
        {/* Left: Opportunities Management */}
        <Grid item xs={12} md={7}>
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight={600}>Internship Opportunities</Typography>
            <Button variant="contained" startIcon={<Add />} onClick={() => setOpenDialog(true)} sx={{ borderRadius: 2 }}>
              New Posting
            </Button>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {opportunities.map((opp) => (
              <Paper key={opp.id} sx={{ p: 3, borderRadius: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={700}>{opp.title}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <LocationOn sx={{ fontSize: 14 }} /> {opp.location_state}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton size="small" onClick={() => handleViewApplicants(opp.id)} sx={{ color: 'primary.main', backgroundColor: 'rgba(17, 24, 39, 0.03)' }}>
                      <People sx={{ fontSize: 18 }} />
                    </IconButton>
                    <IconButton size="small"><Edit sx={{ fontSize: 18 }} /></IconButton>
                    <IconButton size="small" color="error"><Delete sx={{ fontSize: 18 }} /></IconButton>
                  </Box>
                </Box>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="subtitle2" fontWeight={700}>{opp.slots_available}</Typography>
                      <Typography variant="caption" color="text.secondary">Slots</Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="subtitle2" fontWeight={700}>
                        {applications.filter(a => a.opportunity === opp.id).length}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">Applicants</Typography>
                    </Box>
                  </Box>
                  <Button size="small" variant="text" onClick={() => handleViewApplicants(opp.id)}>View all applicants</Button>
                </Box>
              </Paper>
            ))}
            {opportunities.length === 0 && (
              <Paper sx={{ p: 6, textAlign: 'center', borderStyle: 'dashed' }}>
                <Typography color="text.secondary">No opportunities posted yet.</Typography>
              </Paper>
            )}
          </Box>
        </Grid>

        {/* Right: Company Profile */}
        <Grid item xs={12} md={5}>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>Company Profile</Typography>
          <Paper sx={{ p: 4, borderRadius: 3 }}>
            <Box component="form">
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" fontWeight={500} sx={{ mb: 1 }}>Company name</Typography>
                <TextField fullWidth name="company_name" value={profile.company_name} onChange={handleProfileChange} />
              </Box>
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" fontWeight={500} sx={{ mb: 1 }}>Industry sector</Typography>
                <TextField fullWidth select name="industry_sector" value={profile.industry_sector} onChange={handleProfileChange}>
                  {taxonomy.sectors.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </TextField>
              </Box>
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" fontWeight={500} sx={{ mb: 1 }}>Office address</Typography>
                <TextField fullWidth multiline rows={3} name="address" value={profile.address} onChange={handleProfileChange} />
              </Box>
              <Box sx={{ mb: 4 }}>
                <Typography variant="body2" fontWeight={500} sx={{ mb: 1 }}>Contact details</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField fullWidth placeholder="Contact Name" name="contact_person_name" value={profile.contact_person_name} onChange={handleProfileChange} />
                  <TextField fullWidth placeholder="Contact Phone" name="contact_phone" value={profile.contact_phone} onChange={handleProfileChange} />
                </Box>
              </Box>
              <Button fullWidth variant="contained" onClick={handleProfileUpdate}>
                Save changes
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Modern Applicant Management Dialog */}
      <Dialog
        open={openApplicants}
        onClose={() => setOpenApplicants(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 4 } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Candidate Review</DialogTitle>
        <DialogContent dividers sx={{ backgroundColor: 'rgba(17, 24, 39, 0.01)' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, py: 1 }}>
            {selectedOppApplicants.map((app) => (
              <Paper key={app.id} sx={{ p: 3, borderRadius: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>{app.student_details?.full_name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      CGPA: {app.student_details?.cgpa} · Level: {app.student_details?.level}
                    </Typography>
                  </Box>
                  <Chip
                    label={app.status.toUpperCase()}
                    size="small"
                    sx={{ fontWeight: 700, fontSize: '0.65rem' }}
                    color={app.status === 'accepted' ? 'success' : app.status === 'rejected' ? 'error' : 'default'}
                  />
                </Box>
                <Typography variant="body2" sx={{ mb: 3, p: 2, backgroundColor: 'background.default', borderRadius: 2, fontStyle: 'italic' }}>
                  "{app.cover_letter}"
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button size="small" variant="outlined" onClick={() => handleStatusUpdate(app.id, 'reviewing')}>Mark Reviewing</Button>
                  <Button size="small" variant="outlined" onClick={() => handleStatusUpdate(app.id, 'interviewing')}>Invite Interview</Button>
                  <Box sx={{ flexGrow: 1 }} />
                  <Button size="small" variant="contained" color="success" onClick={() => handleStatusUpdate(app.id, 'accepted')}>Accept</Button>
                  <Button size="small" variant="text" color="error" onClick={() => handleStatusUpdate(app.id, 'rejected')}>Reject</Button>
                </Box>
              </Paper>
            ))}
            {selectedOppApplicants.length === 0 && (
              <Box sx={{ py: 6, textAlign: 'center' }}>
                <Typography color="text.secondary">No applications received for this posting yet.</Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenApplicants(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Posting Opportunity Dialog - Simplified */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Post Internship Opportunity</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ py: 1 }}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" fontWeight={500} sx={{ mb: 1 }}>Job Title</Typography>
              <TextField fullWidth name="title" value={oppFormData.title} onChange={handleOppChange} placeholder="Software Engineering Intern" />
            </Box>
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" fontWeight={500} sx={{ mb: 1 }}>Description</Typography>
              <TextField fullWidth multiline rows={4} name="description" value={oppFormData.description} onChange={handleOppChange} />
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" fontWeight={500} sx={{ mb: 1 }}>Sector</Typography>
                <TextField fullWidth select name="sector" value={oppFormData.sector} onChange={handleOppChange}>
                  {taxonomy.sectors.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" fontWeight={500} sx={{ mb: 1 }}>State</Typography>
                <TextField fullWidth select name="location_state" value={oppFormData.location_state} onChange={handleOppChange}>
                  {taxonomy.locations.map(l => <MenuItem key={l} value={l}>{l}</MenuItem>)}
                </TextField>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenDialog(false)} sx={{ color: 'text.secondary' }}>Cancel</Button>
          <Button variant="contained" onClick={handlePostOpportunity}>Publish Posting</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default OrganizationDashboard;
