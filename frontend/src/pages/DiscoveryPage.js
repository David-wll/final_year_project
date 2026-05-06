import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Box, Grid,
  Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions,
  Chip, Alert, CircularProgress, InputAdornment, Paper, Divider, Collapse, MenuItem,
  DialogContentText, List, ListItem, ListItemIcon, ListItemText, Avatar, Stack,
  Tabs, Tab, Badge, IconButton, LinearProgress
} from '@mui/material';
import {
  Search, LocationOn, Business, Star, ArrowForward, UploadFile, AutoFixHigh, FilterList,
  CalendarMonth, Groups, Payments, Verified, Work, CheckCircle, BookmarkBorder,
  Send, Close, Favorite, FavoriteBorder, Person, Timeline, HowToReg, WhatsApp, Email,
  AutoAwesome, Cancel, History
} from '@mui/icons-material';
import api from '../services/api';

const DiscoveryPage = () => {
  const [opportunities, setOpportunities] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [profile, setProfile] = useState(null);
  const [applications, setApplications] = useState([]);
  const [savedIds, setSavedIds] = useState(new Set());
  const [followedIds, setFollowedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sectorFilter, setSectorFilter] = useState('');

  const [selectedOpp, setSelectedOpp] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');

  // Custom ML Match State
  const [showCustomMatch, setShowCustomMatch] = useState(false);
  const [resumeFile, setResumeFile] = useState(null);
  const [manualSkills, setManualSkills] = useState('');

  // Extra meticulous parameters
  const [customCgpa, setCustomCgpa] = useState('');
  const [customLevel, setCustomLevel] = useState('');
  const [customSector, setCustomSector] = useState('');
  const [customLocation, setCustomLocation] = useState('');

  const [matching, setMatching] = useState(false);
  const [extractedSkills, setExtractedSkills] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [savedOpportunities, setSavedOpportunities] = useState([]);
  const [followedOrganizations, setFollowedOrganizations] = useState([]);

  const formatDate = (value) => {
    if (!value) return 'Not set';
    const d = new Date(value);
    return Number.isNaN(d.getTime())
      ? value
      : d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getOpportunityFit = (opp) => {
    if (!opp) return 'Unknown';
    if (opp.slots_available <= opp.slots_filled) return 'Filled';
    return 'Open';
  };

  const isSaved = (opp) => savedIds.has(opp?.id);
  const isFollowing = (opp) => followedIds.has(opp?.organization);

  const buildDetailRows = (opp) => ([
    { icon: <Business fontSize="small" />, label: 'Company', value: opp?.organization_name || 'Unknown organization' },
    { icon: <Work fontSize="small" />, label: 'Sector', value: opp?.sector || 'General' },
    { icon: <LocationOn fontSize="small" />, label: 'Location', value: `${opp?.location_state || 'Nigeria'}` },
    { icon: <CalendarMonth fontSize="small" />, label: 'Start date', value: formatDate(opp?.start_date) },
    { icon: <CalendarMonth fontSize="small" />, label: 'Deadline', value: formatDate(opp?.application_deadline) },
    { icon: <Groups fontSize="small" />, label: 'Slots', value: `${opp?.slots_filled || 0}/${opp?.slots_available || 0} filled` },
    { icon: <Payments fontSize="small" />, label: 'Stipend', value: opp?.stipend_available ? `Available • ₦${opp.stipend_amount}` : 'Not disclosed' },
  ]);

  const canApply = selectedOpp
    && selectedOpp.slots_available > selectedOpp.slots_filled;

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [oppsRes, recsRes, meRes, profileRes, appsRes, savedRes, followedRes] = await Promise.all([
        api.get('placements/discovery/'),
        api.get('recommendations/'),
        api.get('auth/me/'),
        api.get('students/profile/'),
        api.get('placements/student/applications/'),
        api.get('placements/saved/'),
        api.get('placements/followed/')
      ]);
      setOpportunities(oppsRes.data);
      setRecommendations(recsRes.data.results || []);
      setProfile({ ...(meRes.data || {}), ...(profileRes.data || {}) });
      setApplications(appsRes.data || []);
      
      const sIds = new Set((savedRes.data || []).map(i => i.opportunity));
      setSavedIds(sIds);
      setSavedOpportunities(oppsRes.data.filter(o => sIds.has(o.id)));

      const fIds = new Set((followedRes.data || []).map(i => i.organization));
      setFollowedIds(fIds);
    } catch (err) {
      setError('Failed to load opportunities');
    } finally {
      setLoading(false);
    }
  };

  const toggleSaved = async (oppId) => {
    try {
      const res = await api.post('placements/saved/toggle/', { opportunity_id: oppId });
      setSavedIds((prev) => {
        const next = new Set(prev);
        if (res.data.saved) {
          next.add(oppId);
          const opp = opportunities.find(o => o.id === oppId);
          if (opp) setSavedOpportunities(prev => [...prev, opp]);
        } else {
          next.delete(oppId);
          setSavedOpportunities(prev => prev.filter(s => s.id !== oppId));
        }
        return next;
      });
    } catch (err) {
      setError('Unable to update saved opportunities.');
    }
  };

  const toggleFollow = async (orgId) => {
    try {
      await api.post('placements/follow/toggle/', { organization_id: orgId });
      setFollowedIds((prev) => {
        const next = new Set(prev);
        if (next.has(orgId)) next.delete(orgId);
        else next.add(orgId);
        return next;
      });
    } catch (err) {
      setError('Unable to update following list.');
    }
  };

  const handleApplyClick = (opp) => {
    setSelectedOpp(opp);
    setDetailsOpen(true);
  };

  const handleApply = async () => {
    setSubmitting(true);
    try {
      await api.post('placements/student/applications/', {
        opportunity: selectedOpp.id,
        cover_letter: coverLetter
      });
      setSuccess('Application sent successfully!');
      setOpenDialog(false);
      fetchInitialData();
    } catch (err) {
      setError('Failed to submit application.');
    } finally {
      setSubmitting(false);
    }
  };

  const JobCard = ({ opp, rec, isRec }) => {
    const score = rec?.match_score || 0;
    return (
      <Paper 
        sx={{ 
          p: 0, borderRadius: 4, overflow: 'hidden', height: '100%',
          display: 'flex', flexDirection: 'column',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          '&:hover': { 
            transform: 'translateY(-4px)',
            boxShadow: '0 12px 24px -8px rgba(0,0,0,0.1)'
          },
          border: isRec && score >= 80 ? '2px solid' : '1px solid',
          borderColor: isRec && score >= 80 ? 'primary.main' : 'divider',
          position: 'relative'
        }}
      >
        {isRec && score >= 80 && (
          <Chip label="Top Match" color="primary" size="small" sx={{ position: 'absolute', top: 12, right: 12, fontWeight: 800, height: 20, fontSize: '0.65rem' }} />
        )}
        <Box sx={{ p: 3, flexGrow: 1 }}>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Avatar sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: 'rgba(17, 24, 39, 0.05)', color: 'primary.main', fontWeight: 800 }}>
              {opp.organization_name[0]}
            </Avatar>
            <Box>
              <Typography variant="subtitle1" fontWeight={800} noWrap sx={{ maxWidth: 200 }}>{opp.title}</Typography>
              <Typography variant="body2" color="text.secondary">{opp.organization_name}</Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
            <Chip size="small" icon={<LocationOn sx={{ fontSize: 14 }} />} label={opp.location_state} variant="outlined" />
            <Chip size="small" label={opp.sector} variant="outlined" />
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
            {opp.description}
          </Typography>
        </Box>
        <Divider />
        <Box sx={{ p: 2, bgcolor: 'rgba(17, 24, 39, 0.01)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {isRec ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress variant="determinate" value={score} size={24} thickness={6} color={score >= 70 ? 'success' : 'warning'} />
              <Typography variant="caption" fontWeight={800}>{score}% MATCH</Typography>
            </Box>
          ) : (
            <Typography variant="caption" fontWeight={700} color="text.secondary">{opp.slots_available - opp.slots_filled} SLOTS LEFT</Typography>
          )}
          <Button size="small" variant="contained" onClick={() => handleApplyClick(opp)} sx={{ borderRadius: 2, fontWeight: 700 }}>View Details</Button>
        </Box>
      </Paper>
    );
  };

  const handleCustomMatch = async () => {
    setMatching(true);
    try {
      const formData = new FormData();
      if (resumeFile) formData.append('resume', resumeFile);
      if (manualSkills) formData.append('manual_skills', manualSkills);
      const res = await api.post('recommendations/match-custom/', formData);
      setRecommendations(res.data.results || []);
      setExtractedSkills(res.data.extracted_skills || []);
      setShowCustomMatch(false);
    } catch (err) {
      setError('Matchmaking failed.');
    } finally {
      setMatching(false);
    }
  };

  const filteredRecs = recommendations.filter(rec => 
    rec.opportunity.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (!sectorFilter || rec.opportunity.sector === sectorFilter)
  );
  const filteredOpps = opportunities.filter(opp => 
    opp.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (!sectorFilter || opp.sector === sectorFilter)
  );
  const sectors = [...new Set(opportunities.map(opp => opp.sector))].sort();

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Box sx={{ mb: 6 }}>
        <Typography variant="h4" fontWeight={800} gutterBottom>Find your next internship</Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>Premium opportunities matched to your skills.</Typography>

        <Paper sx={{ p: 3, mb: 4, borderRadius: 3 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.main' }}><Person /></Avatar>
                <Box>
                  <Typography variant="h6" fontWeight={800}>{profile?.full_name || 'Your Profile'}</Typography>
                  <Typography variant="body2" color="text.secondary">Level {profile?.level} • {profile?.course_of_study}</Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={8}>
              <Stack direction="row" spacing={2} flexWrap="wrap">
                <Box sx={{ p: 1.5, border: '1px solid #eee', borderRadius: 2, minWidth: 120 }}>
                  <Typography variant="caption" color="text.secondary">Completion</Typography>
                  <Typography variant="h6" fontWeight={800}>{profile?.profile_completeness}%</Typography>
                </Box>
                <Box sx={{ p: 1.5, border: '1px solid #eee', borderRadius: 2, minWidth: 120 }}>
                  <Typography variant="caption" color="text.secondary">Applications</Typography>
                  <Typography variant="h6" fontWeight={800}>{applications.length}</Typography>
                </Box>
              </Stack>
            </Grid>
          </Grid>
        </Paper>

        <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} sx={{ mb: 4 }}>
          <Tab icon={<Search sx={{ mr: 1 }} />} label="Discover" iconPosition="start" />
          <Tab icon={<BookmarkBorder sx={{ mr: 1 }} />} label="Saved" iconPosition="start" />
          <Tab icon={<HowToReg sx={{ mr: 1 }} />} label="Applications" iconPosition="start" />
        </Tabs>

        {activeTab === 0 && (
          <>
            <Grid container spacing={2} sx={{ mb: 4 }}>
              <Grid item xs={12} md={8}>
                <TextField fullWidth placeholder="Search roles..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField select fullWidth label="Sector" value={sectorFilter} onChange={e => setSectorFilter(e.target.value)}>
                  <MenuItem value="">All Sectors</MenuItem>
                  {sectors.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </TextField>
              </Grid>
            </Grid>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 4 }}>
              <Button variant="text" startIcon={<AutoFixHigh />} onClick={() => setShowCustomMatch(!showCustomMatch)}>Fine-tune Recommendations</Button>
            </Box>

            <Collapse in={showCustomMatch}>
              <Paper sx={{ p: 4, mb: 6, borderRadius: 4, bgcolor: 'rgba(59, 130, 246, 0.03)', border: '1px solid #e3f2fd' }}>
                <Typography variant="h6" fontWeight={800} gutterBottom>AI Matchmaker</Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Button variant="outlined" component="label" fullWidth startIcon={<UploadFile />} sx={{ py: 2, borderStyle: 'dashed' }}>
                      {resumeFile ? resumeFile.name : "Upload Resume"}
                      <input type="file" hidden accept=".pdf" onChange={e => setResumeFile(e.target.files[0])} />
                    </Button>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth label="Skills (comma separated)" value={manualSkills} onChange={e => setManualSkills(e.target.value)} />
                  </Grid>
                  <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                    <Button onClick={() => setShowCustomMatch(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleCustomMatch} disabled={matching}>{matching ? 'Analyzing...' : 'Rank Now'}</Button>
                  </Grid>
                </Grid>
              </Paper>
            </Collapse>

            {filteredRecs.length > 0 && (
              <Box sx={{ mb: 6 }}>
                <Typography variant="h5" fontWeight={800} sx={{ mb: 3 }}>Recommended for you</Typography>
                <Grid container spacing={3}>
                  {filteredRecs.map(rec => <Grid item xs={12} sm={6} md={4} key={rec.opportunity.id}><JobCard opp={rec.opportunity} rec={rec} isRec={true} /></Grid>)}
                </Grid>
              </Box>
            )}

            <Typography variant="h5" fontWeight={800} sx={{ mb: 3 }}>All Opportunities</Typography>
            <Grid container spacing={3}>
              {filteredOpps.map(opp => <Grid item xs={12} sm={6} md={4} key={opp.id}><JobCard opp={opp} isRec={false} /></Grid>)}
            </Grid>
          </>
        )}

        {activeTab === 1 && (
          <Grid container spacing={3}>
            {savedOpportunities.map(opp => <Grid item xs={12} sm={6} md={4} key={opp.id}><JobCard opp={opp} isRec={false} /></Grid>)}
            {savedOpportunities.length === 0 && <Grid item xs={12} sx={{ textAlign: 'center', py: 10 }}><Typography color="text.secondary">No saved jobs.</Typography></Grid>}
          </Grid>
        )}

        {activeTab === 2 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {applications.map(app => (
              <Paper key={app.id} sx={{ p: 3, borderRadius: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h6" fontWeight={800}>{app.opportunity_details?.title}</Typography>
                  <Typography variant="body2" color="text.secondary">{app.opportunity_details?.organization_name}</Typography>
                </Box>
                <Chip label={app.status.toUpperCase()} color={app.status === 'accepted' ? 'success' : 'primary'} />
              </Paper>
            ))}
            {applications.length === 0 && <Box sx={{ textAlign: 'center', py: 10 }}><Typography color="text.secondary">No applications yet.</Typography></Box>}
          </Box>
        )}
      </Box>

      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>{selectedOpp?.title}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={4}>
            <Grid item xs={12} md={8}>
              <Typography variant="subtitle2" fontWeight={800} color="primary" gutterBottom>ABOUT THE ROLE</Typography>
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', mb: 4 }}>{selectedOpp?.description}</Typography>
              <Typography variant="subtitle2" fontWeight={800} color="primary" gutterBottom>REQUIREMENTS</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {selectedOpp?.required_technical_skills?.map((s, i) => <Chip key={i} label={s.name || s} variant="outlined" />)}
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, bgcolor: '#fcfcfc' }}>
                {buildDetailRows(selectedOpp).map((row, i) => (
                  <Box key={i} sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <Box sx={{ color: 'primary.main' }}>{row.icon}</Box>
                    <Box><Typography variant="caption" color="text.secondary">{row.label}</Typography><Typography variant="body2" fontWeight={700}>{row.value}</Typography></Box>
                  </Box>
                ))}
                <Button fullWidth variant="contained" sx={{ mt: 2, borderRadius: 2 }} onClick={() => { setDetailsOpen(false); setOpenDialog(true); }}>Apply Now</Button>
                <Button fullWidth variant="outlined" sx={{ mt: 1, borderRadius: 2 }} onClick={() => toggleSaved(selectedOpp?.id)}>{isSaved(selectedOpp) ? 'Unsave' : 'Save for Later'}</Button>
              </Paper>
            </Grid>
          </Grid>
        </DialogContent>
      </Dialog>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Application for {selectedOpp?.title}</DialogTitle>
        <DialogContent>
          <TextField fullWidth multiline rows={5} label="Why are you a good fit?" value={coverLetter} onChange={e => setCoverLetter(e.target.value)} sx={{ mt: 2 }} />
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleApply} disabled={submitting || !coverLetter.trim()}>{submitting ? 'Sending...' : 'Submit Application'}</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default DiscoveryPage;
