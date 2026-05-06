import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Box, Paper, Grid, TextField, Button,
  Alert, CircularProgress, Divider, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, MenuItem, Chip,
  Autocomplete, Avatar, Tooltip, LinearProgress
} from '@mui/material';
import { 
  Delete, Edit, Add, People, LocationOn, Verified, History, 
  AutoAwesome, CheckCircle, Cancel, Email, WhatsApp 
} from '@mui/icons-material';
import api from '../services/api';

const OrganizationDashboard = () => {
  const [profile, setProfile] = useState(null);
  const [opportunities, setOpportunities] = useState([]);
  const [applications, setApplications] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [openApplicants, setOpenApplicants] = useState(false);
  const [selectedOpp, setSelectedOpp] = useState(null);
  const [rankedApplicants, setRankedApplicants] = useState([]);
  const [rankingLoading, setRankingLoading] = useState(false);
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
      const [profileRes, oppsRes, taxRes, activityRes, appsRes] = await Promise.all([
        api.get('organizations/profile/'),
        api.get('organizations/opportunities/'),
        api.get('students/taxonomy/'),
        api.get('placements/activity/'),
        api.get('placements/organization/applications/')
      ]);
      setProfile(profileRes.data);
      setOpportunities(oppsRes.data);
      setTaxonomy(taxRes.data);
      setActivities(activityRes.data);
      setApplications(appsRes.data);
    } catch (err) {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleViewApplicants = async (opp) => {
    setSelectedOpp(opp);
    setOpenApplicants(true);
    setRankingLoading(true);
    try {
      const res = await api.get(`organizations/opportunities/${opp.id}/ranked-applicants/`);
      setRankedApplicants(res.data);
    } catch (err) {
      setError('Failed to fetch ranked applicants');
    } finally {
      setRankingLoading(false);
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

  const handleStatusUpdate = async (appId, newStatus) => {
    try {
      await api.patch(`placements/applications/${appId}/status/`, { status: newStatus });
      setSuccess(`Application ${newStatus} successfully!`);
      // Update local state for the ranked list
      setRankedApplicants(prev => prev.map(app => 
        app.application_id === appId ? { ...app, status: newStatus } : app
      ));
      fetchData(); // Refresh overview counts
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

          <Paper sx={{ p: 3, borderRadius: 3, mt: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
              <History fontSize="small" color="primary" />
              <Typography variant="h6" fontWeight={600}>Recent Activity</Typography>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {activities.slice(0, 5).map((item) => (
                <Paper key={item.id} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                  <Typography variant="subtitle2" fontWeight={700}>{item.title}</Typography>
                  <Typography variant="body2" color="text.secondary">{item.message}</Typography>
                </Paper>
              ))}
              {activities.length === 0 && (
                <Typography variant="body2" color="text.secondary">No recent activity yet.</Typography>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Enhanced AI-Ranked Applicant Management Dialog */}
      <Dialog
        open={openApplicants}
        onClose={() => setOpenApplicants(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 4, minHeight: 600 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1.5, py: 3 }}>
          <AutoAwesome color="primary" /> AI-Ranked Applicants: {selectedOpp?.title}
        </DialogTitle>
        <DialogContent dividers sx={{ backgroundColor: 'rgba(17, 24, 39, 0.01)', p: 0 }}>
          {rankingLoading ? (
            <Box sx={{ py: 10, textAlign: 'center' }}>
              <CircularProgress size={32} thickness={5} sx={{ mb: 2 }} />
              <Typography variant="body2" color="text.secondary">Our AI is ranking candidates based on skills and background...</Typography>
            </Box>
          ) : (
            <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
              {rankedApplicants.map((app, index) => (
                <Paper key={app.application_id} sx={{ p: 4, borderRadius: 3, border: index === 0 ? '2px solid' : '1px solid', borderColor: index === 0 ? 'primary.main' : 'rgba(0,0,0,0.05)', position: 'relative' }}>
                  {index === 0 && (
                    <Chip 
                      label="BEST MATCH" 
                      color="primary" 
                      size="small" 
                      sx={{ position: 'absolute', top: -12, right: 20, fontWeight: 800, height: 24 }} 
                    />
                  )}
                  
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={8}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Avatar sx={{ width: 48, height: 48, bgcolor: 'primary.main', fontWeight: 700 }}>
                          {app.student.full_name[0]}
                        </Avatar>
                        <Box>
                          <Typography variant="h6" fontWeight={800}>{app.student.full_name}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {app.student.course_of_study} • Level {app.student.level} • {app.student.department}
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" fontWeight={800} color="primary" sx={{ textTransform: 'uppercase', display: 'block', mb: 1 }}>
                          Matching Skills
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {app.matched_skills.map(s => <Chip key={s} label={s} size="small" color="success" variant="outlined" sx={{ fontWeight: 600 }} />)}
                          {app.matched_skills.length === 0 && <Typography variant="caption" color="text.secondary">No direct skill matches</Typography>}
                        </Box>
                      </Box>

                      {app.missing_skills.length > 0 && (
                        <Box sx={{ mb: 3 }}>
                          <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ textTransform: 'uppercase', display: 'block', mb: 1 }}>
                            Missing Skills
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {app.missing_skills.map(s => <Chip key={s} label={s} size="small" variant="outlined" sx={{ fontWeight: 600, opacity: 0.6 }} />)}
                          </Box>
                        </Box>
                      )}
                    </Grid>

                    <Grid item xs={12} sm={4} sx={{ textAlign: { sm: 'right' }, borderLeft: { sm: '1px solid rgba(0,0,0,0.05)' } }}>
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ textTransform: 'uppercase' }}>
                          Match Score
                        </Typography>
                        <Typography variant="h3" fontWeight={800} color="primary.main">
                          {app.match_score}%
                        </Typography>
                        <LinearProgress 
                          variant="determinate" 
                          value={app.match_score} 
                          sx={{ height: 6, borderRadius: 3, mt: 1, bgcolor: 'rgba(0,0,0,0.05)' }} 
                        />
                      </Box>
                      
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Chip 
                          label={app.status.toUpperCase()} 
                          color={app.status === 'accepted' ? 'success' : app.status === 'rejected' ? 'error' : 'default'}
                          sx={{ fontWeight: 800, mb: 2 }}
                        />
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                          <Tooltip title="Email Candidate">
                            <IconButton size="small" sx={{ bgcolor: 'rgba(0,0,0,0.03)' }}><Email sx={{ fontSize: 18 }} /></IconButton>
                          </Tooltip>
                          <Tooltip title="WhatsApp Candidate">
                            <IconButton size="small" sx={{ bgcolor: 'rgba(0,0,0,0.03)' }}><WhatsApp sx={{ fontSize: 18 }} /></IconButton>
                          </Tooltip>
                        </Box>
                      </Box>
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 3 }} />

                  <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                    <Button 
                      size="small" variant="outlined" startIcon={<CheckCircle />} color="success"
                      disabled={app.status === 'accepted'}
                      onClick={() => handleStatusUpdate(app.application_id, 'accepted')}
                    >
                      Hire Student
                    </Button>
                    <Button 
                      size="small" variant="outlined" startIcon={<History />}
                      onClick={() => handleStatusUpdate(app.application_id, 'interviewing')}
                    >
                      Schedule Interview
                    </Button>
                    <Box sx={{ flexGrow: 1 }} />
                    <Button 
                      size="small" variant="text" startIcon={<Cancel />} color="error"
                      disabled={app.status === 'rejected'}
                      onClick={() => handleStatusUpdate(app.application_id, 'rejected')}
                    >
                      Reject
                    </Button>
                  </Box>
                </Paper>
              ))}
              {rankedApplicants.length === 0 && (
                <Box sx={{ py: 10, textAlign: 'center' }}>
                  <Typography color="text.secondary">No applications received yet.</Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenApplicants(false)} variant="outlined" sx={{ borderRadius: 2 }}>Close</Button>
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
                <Autocomplete
                  freeSolo
                  options={taxonomy.locations}
                  value={oppFormData.location_state}
                  onChange={(_, newValue) => setOppFormData({ ...oppFormData, location_state: newValue || '' })}
                  onInputChange={(_, newValue) => setOppFormData({ ...oppFormData, location_state: newValue })}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      placeholder="Lagos, Abuja, Kano..."
                    />
                  )}
                />
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" fontWeight={500} sx={{ mb: 1 }}>LGA / City</Typography>
                <TextField
                  fullWidth
                  name="location_lga"
                  value={oppFormData.location_lga}
                  onChange={handleOppChange}
                  placeholder="Ikeja, Wuse, Garki..."
                />
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" fontWeight={500} sx={{ mb: 1 }}>Start date</Typography>
                <TextField fullWidth type="date" name="start_date" value={oppFormData.start_date} onChange={handleOppChange} InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" fontWeight={500} sx={{ mb: 1 }}>Deadline</Typography>
                <TextField fullWidth type="date" name="application_deadline" value={oppFormData.application_deadline} onChange={handleOppChange} InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" fontWeight={500} sx={{ mb: 1 }}>Duration (weeks)</Typography>
                <TextField fullWidth type="number" name="duration_weeks" value={oppFormData.duration_weeks} onChange={handleOppChange} />
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" fontWeight={500} sx={{ mb: 1 }}>Slots available</Typography>
                <TextField fullWidth type="number" name="slots_available" value={oppFormData.slots_available} onChange={handleOppChange} />
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" fontWeight={500} sx={{ mb: 1 }}>Stipend</Typography>
                <TextField fullWidth type="number" name="stipend_amount" value={oppFormData.stipend_amount} onChange={handleOppChange} disabled={!oppFormData.stipend_available} />
              </Grid>
              <Grid item xs={6} sx={{ display: 'flex', alignItems: 'end' }}>
                <Button
                  variant={oppFormData.stipend_available ? 'contained' : 'outlined'}
                  onClick={() => setOppFormData({ ...oppFormData, stipend_available: !oppFormData.stipend_available })}
                  fullWidth
                >
                  {oppFormData.stipend_available ? 'Stipend Included' : 'No Stipend'}
                </Button>
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
