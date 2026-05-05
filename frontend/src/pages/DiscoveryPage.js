import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Box, Grid,
  Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions,
  Chip, Alert, CircularProgress, InputAdornment, Paper, Divider, Collapse, MenuItem,
  DialogContentText, List, ListItem, ListItemIcon, ListItemText, Avatar, Stack,
  Tabs, Tab, Badge
} from '@mui/material';
import {
  Search, LocationOn, Business, Star, ArrowForward, UploadFile, AutoFixHigh, FilterList,
  CalendarMonth, Groups, Payments, Verified, Work, CheckCircle, BookmarkBorder,
  Send, Close, Favorite, FavoriteBorder, Person, Timeline, HowToReg
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
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [timelineActivities, setTimelineActivities] = useState([]);
  const [timelineApplication, setTimelineApplication] = useState(null);

  // Tab management
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

  const getDaysLeft = (deadline) => {
    if (!deadline) return null;
    const diff = new Date(deadline).getTime() - new Date().getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const getOpportunityFit = (opp) => {
    if (!opp) return 'Unknown';
    if (opp.slots_available <= opp.slots_filled) return 'Filled';
    if (getDaysLeft(opp.application_deadline) === 0) return 'Closing today';
    return 'Open';
  };

  const isSaved = (opp) => savedIds.has(opp?.id);
  const isFollowing = (opp) => followedIds.has(opp?.organization);

  const buildDetailRows = (opp) => ([
    { icon: <Business fontSize="small" />, label: 'Company', value: opp?.organization_name || 'Unknown organization' },
    { icon: <Work fontSize="small" />, label: 'Sector', value: opp?.sector || 'General' },
    { icon: <LocationOn fontSize="small" />, label: 'Location', value: `${opp?.location_state || 'Nigeria'}${opp?.location_lga ? ` • ${opp.location_lga}` : ''}` },
    { icon: <CalendarMonth fontSize="small" />, label: 'Start date', value: formatDate(opp?.start_date) },
    { icon: <CalendarMonth fontSize="small" />, label: 'Deadline', value: formatDate(opp?.application_deadline) },
    { icon: <Groups fontSize="small" />, label: 'Slots', value: `${opp?.slots_filled || 0}/${opp?.slots_available || 0} filled` },
    { icon: <Payments fontSize="small" />, label: 'Stipend', value: opp?.stipend_available ? `Available${opp?.stipend_amount ? ` • ₦${opp.stipend_amount}` : ''}` : 'Not disclosed' },
  ]);

  const canApply = selectedOpp
    && selectedOpp.slots_available > selectedOpp.slots_filled
    && (!selectedOpp.application_deadline || new Date(selectedOpp.application_deadline) >= new Date(new Date().toDateString()));

  useEffect(() => {
    fetchOpportunities();
  }, []);

  const fetchOpportunities = async () => {
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
      // Fetch detailed saved opportunities and followed organizations
      const savedDetails = await Promise.all(
        (savedRes.data || []).map(item => api.get(`placements/opportunities/${item.opportunity}/`))
      );
      setSavedOpportunities(savedDetails.map(res => res.data));
      
      const followedDetails = await Promise.all(
        (followedRes.data || []).map(item => api.get(`organizations/${item.organization}/`))
      );
      setFollowedOrganizations(followedDetails.map(res => res.data));
    } catch (err) {
      setError('Failed to load opportunities');
    } finally {
      setLoading(false);
    }
  };

  const openTimeline = async (application) => {
    setTimelineApplication(application);
    setTimelineOpen(true);
    setTimelineLoading(true);
    try {
      const res = await api.get(`placements/applications/${application.id}/timeline/`);
      setTimelineActivities(res.data || []);
    } catch (err) {
      setTimelineActivities([]);
      setError('Failed to load application timeline');
    } finally {
      setTimelineLoading(false);
    }
  };

  const toggleSaved = async (oppId) => {
    try {
      const res = await api.post('placements/saved/toggle/', { opportunity_id: oppId });
      setSavedIds((prev) => {
        const next = new Set(prev);
        if (res.data.saved) {
          next.add(oppId);
          // Add to saved opportunities if not already there
          const opp = opportunities.find(o => o.id === oppId) || recommendations.find(r => r.opportunity.id === oppId)?.opportunity;
          if (opp && !savedOpportunities.find(s => s.id === oppId)) {
            setSavedOpportunities(prev => [...prev, opp]);
          }
        } else {
          next.delete(oppId);
          // Remove from saved opportunities
          setSavedOpportunities(prev => prev.filter(s => s.id !== oppId));
        }
        return next;
      });
    } catch (err) {
      setError('Unable to update saved opportunities right now.');
    }
  };

  const toggleFollow = async (orgId) => {
    try {
      const res = await api.post('placements/follow/toggle/', { organization_id: orgId });
      const isFollowed = res.data.followed;

      setFollowedIds((prev) => {
        const next = new Set(prev);
        if (isFollowed) {
          next.add(orgId);
        } else {
          next.delete(orgId);
          // Remove from followed organizations
          setFollowedOrganizations(prev => prev.filter(f => f.id !== orgId));
        }
        return next;
      });

      if (isFollowed) {
        // Add to followed organizations if not already there
        const org = opportunities.find(o => o.organization === orgId)?.organization_name;
        if (org && !followedOrganizations.find(f => f.id === orgId)) {
          try {
            const orgRes = await api.get(`organizations/${orgId}/`);
            setFollowedOrganizations(prev => [...prev, orgRes.data]);
          } catch (e) {
            console.error('Failed to fetch organization details');
          }
        }
      }
    } catch (err) {
      setError('Unable to update followed organizations right now.');
    }
  };

  const handleApplyClick = (opp) => {
    setSelectedOpp(opp);
    setDetailsOpen(true);
    setSuccess('');
    setError('');
  };

  const handleBeginApplication = () => {
    setCoverLetter('');
    setDetailsOpen(false);
    setOpenDialog(true);
    setError('');
  };

  const handleApplySubmit = async () => {
    const text = coverLetter.trim();
    if (text.length < 120) {
      setError('Please write at least 120 characters. Strong applications get better responses.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await api.post('placements/student/applications/', {
        opportunity: selectedOpp.id,
        cover_letter: text
      });
      setSuccess('Application submitted successfully!');
      setTimeout(() => {
        setOpenDialog(false);
        setSelectedOpp(null);
        setCoverLetter('');
      }, 2000);
    } catch (err) {
      const apiError = err.response?.data;
      setError(
        apiError?.cover_letter?.[0] ||
        apiError?.opportunity?.[0] ||
        apiError?.non_field_errors?.[0] ||
        'Failed to submit application'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCustomMatch = async () => {
    setMatching(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      if (resumeFile) formData.append('resume', resumeFile);
      if (manualSkills) formData.append('manual_skills', manualSkills);
      if (customCgpa) formData.append('cgpa', customCgpa);
      if (customLevel) formData.append('level', customLevel);
      if (customSector) formData.append('sector', customSector);
      if (customLocation) formData.append('location', customLocation);

      const res = await api.post('recommendations/match-custom/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setRecommendations(res.data.results || []);
      setExtractedSkills(res.data.extracted_skills || []);
      setSuccess('Matches updated successfully based on your provided details!');
      setShowCustomMatch(false);
    } catch (err) {
      setError('Failed to generate custom matches. Try again later.');
    } finally {
      setMatching(false);
    }
  };

  const matchesSearch = (opp) => {
    const term = searchTerm.toLowerCase();
    const matchesSector = !sectorFilter || opp.sector === sectorFilter;
    return matchesSector && (
      opp.title.toLowerCase().includes(term) ||
      opp.organization_name.toLowerCase().includes(term) ||
      opp.sector.toLowerCase().includes(term) ||
      opp.location_state.toLowerCase().includes(term) ||
      opp.description.toLowerCase().includes(term) ||
      (opp.required_technical_skills && opp.required_technical_skills.some(skill => 
        skill.name && skill.name.toLowerCase().includes(term)
      ))
    );
  };

  const filteredRecs = recommendations.filter(rec => matchesSearch(rec.opportunity));
  const filteredOpps = opportunities.filter(opp => matchesSearch(opp));

  // Get unique sectors from opportunities
  const sectors = [...new Set(opportunities.map(opp => opp.sector))].sort();

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
      <CircularProgress size={32} thickness={5} />
    </Box>
  );

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Box sx={{ mb: 6 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
          Find your next internship
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Browse verified opportunities or check out your personalized recommendations.
        </Typography>

        {/* Profile Summary */}
        <Paper sx={{ p: 3, mb: 4, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ width: 64, height: 64, bgcolor: 'primary.main' }}>
                  <Person />
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight={800}>
                    {profile?.full_name || profile?.email || 'Your profile'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {profile?.email || 'Student account'}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={8}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} useFlexGap flexWrap="wrap">
                <Paper variant="outlined" sx={{ px: 2, py: 1.5, borderRadius: 2, minWidth: 150 }}>
                  <Typography variant="caption" color="text.secondary">Profile completion</Typography>
                  <Typography variant="h6" fontWeight={800}>{profile?.profile_completeness ?? 0}%</Typography>
                </Paper>
                <Paper variant="outlined" sx={{ px: 2, py: 1.5, borderRadius: 2, minWidth: 150 }}>
                  <Typography variant="caption" color="text.secondary">Saved gigs</Typography>
                  <Typography variant="h6" fontWeight={800}>{savedIds.size}</Typography>
                </Paper>
                <Paper variant="outlined" sx={{ px: 2, py: 1.5, borderRadius: 2, minWidth: 150 }}>
                  <Typography variant="caption" color="text.secondary">Following</Typography>
                  <Typography variant="h6" fontWeight={800}>{followedIds.size}</Typography>
                </Paper>
                <Paper variant="outlined" sx={{ px: 2, py: 1.5, borderRadius: 2, minWidth: 150 }}>
                  <Typography variant="caption" color="text.secondary">Applications</Typography>
                  <Typography variant="h6" fontWeight={800}>{applications.length}</Typography>
                </Paper>
              </Stack>
            </Grid>
          </Grid>
        </Paper>

        {/* Navigation Tabs */}
        <Paper sx={{ mb: 4, borderRadius: 3 }}>
          <Tabs 
            value={activeTab} 
            onChange={(e, newValue) => setActiveTab(newValue)}
            variant="fullWidth"
            sx={{ borderRadius: 3 }}
          >
            <Tab 
              label="Discover" 
              icon={<Search />} 
              iconPosition="start"
              sx={{ textTransform: 'none', fontWeight: 600 }}
            />
            <Tab 
              label={
                <Badge badgeContent={savedOpportunities.length} color="primary" max={99}>
                  Saved Jobs
                </Badge>
              }
              icon={<BookmarkBorder />} 
              iconPosition="start"
              sx={{ textTransform: 'none', fontWeight: 600 }}
            />
            <Tab 
              label={
                <Badge badgeContent={followedOrganizations.length} color="primary" max={99}>
                  Following
                </Badge>
              }
              icon={<FavoriteBorder />} 
              iconPosition="start"
              sx={{ textTransform: 'none', fontWeight: 600 }}
            />
            <Tab 
              label={
                <Badge badgeContent={applications.length} color="primary" max={99}>
                  My Applications
                </Badge>
              }
              icon={<HowToReg />} 
              iconPosition="start"
              sx={{ textTransform: 'none', fontWeight: 600 }}
            />
          </Tabs>
        </Paper>

        {/* Tab Content */}
        {activeTab === 0 && (
          <>
            {/* Search and Filters - only on Discover tab */}
            <TextField
              fullWidth
              placeholder="Search by title, company, or sector..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'background.paper',
                  borderRadius: 3,
                  px: 1,
                  '& fieldset': { borderColor: 'divider' },
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
              }}
            />

            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 3 }}>
              <TextField
                select
                label="Filter by Sector"
                value={sectorFilter}
                onChange={(e) => setSectorFilter(e.target.value)}
                sx={{ minWidth: 200 }}
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <FilterList sx={{ fontSize: 20, mr: 0.5 }} />
                    </InputAdornment>
                  ),
                }}
              >
                <MenuItem value="">All Sectors</MenuItem>
                {sectors.map(sector => (
                  <MenuItem key={sector} value={sector}>{sector}</MenuItem>
                ))}
              </TextField>
              {sectorFilter && (
                <Chip
                  label={`${sectorFilter} (${filteredOpps.length})`}
                  onDelete={() => setSectorFilter('')}
                  color="primary"
                  variant="outlined"
                />
              )}
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
              <Button
                variant="text"
                color="primary"
                startIcon={<AutoFixHigh />}
                onClick={() => setShowCustomMatch(!showCustomMatch)}
              >
                Improve My Matches (Upload Resume)
              </Button>
            </Box>
          </>
        )}
      </Box>

      <Collapse in={showCustomMatch}>
        <Paper sx={{ p: 4, mb: 6, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'rgba(59, 130, 246, 0.02)' }}>
          <Typography variant="h6" fontWeight={700} gutterBottom>
            Custom AI Matchmaker
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Upload your resume (PDF) or type your skills manually to instantly re-calculate
            your internship recommendations using our ML engine.
          </Typography>

          <Grid container spacing={3} alignItems="flex-start">
            <Grid item xs={12} md={6}>
              <Button
                variant="outlined"
                component="label"
                fullWidth
                startIcon={<UploadFile />}
                sx={{ py: 1.5, borderStyle: 'dashed', borderWidth: 2, mb: 2 }}
              >
                {resumeFile ? resumeFile.name : "Upload Resume (PDF)"}
                <input
                  type="file"
                  hidden
                  accept="application/pdf"
                  onChange={(e) => setResumeFile(e.target.files[0])}
                />
              </Button>
              <TextField
                fullWidth
                placeholder="Or type skills (e.g. Python, React)"
                value={manualSkills}
                onChange={(e) => setManualSkills(e.target.value)}
                size="medium"
                label="Technical Skills"
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth label="CGPA (e.g. 4.5)"
                    value={customCgpa}
                    onChange={e => setCustomCgpa(e.target.value)}
                    type="number" step="0.1"
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth label="Level (e.g. 400)"
                    value={customLevel}
                    onChange={e => setCustomLevel(e.target.value)}
                    type="number" step="100"
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth label="Preferred Sector"
                    placeholder="e.g. Technology"
                    value={customSector}
                    onChange={e => setCustomSector(e.target.value)}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth label="Preferred Location"
                    placeholder="e.g. Lagos"
                    value={customLocation}
                    onChange={e => setCustomLocation(e.target.value)}
                  />
                </Grid>
              </Grid>
            </Grid>

            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 1 }}>
              <Button onClick={() => setShowCustomMatch(false)} color="inherit">
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleCustomMatch}
                disabled={(!resumeFile && !manualSkills.trim() && !customCgpa && !customSector) || matching}
                startIcon={matching ? <CircularProgress size={16} color="inherit" /> : <AutoFixHigh />}
              >
                {matching ? 'Calculating Detailed Match...' : 'Generate Matches'}
              </Button>
            </Grid>
          </Grid>
        </Paper>
      </Collapse>

        {error && <Alert severity="error" sx={{ mb: 4, borderRadius: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 4, borderRadius: 2 }}>{success}</Alert>}

        {/* Tab Content */}
        {activeTab === 0 && (
          <>
            {/* Custom Match Section */}
            <Collapse in={showCustomMatch}>
              <Paper sx={{ p: 4, mb: 6, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'rgba(59, 130, 246, 0.02)' }}>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  Custom AI Matchmaker
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Upload your resume (PDF) or type your skills manually to instantly re-calculate
                  your internship recommendations using our ML engine.
                </Typography>

                <Grid container spacing={3} alignItems="flex-start">
                  <Grid item xs={12} md={6}>
                    <Button
                      variant="outlined"
                      component="label"
                      fullWidth
                      startIcon={<UploadFile />}
                      sx={{ py: 1.5, borderStyle: 'dashed', borderWidth: 2, mb: 2 }}
                    >
                      {resumeFile ? resumeFile.name : "Upload Resume (PDF)"}
                      <input
                        type="file"
                        hidden
                        accept="application/pdf"
                        onChange={(e) => setResumeFile(e.target.files[0])}
                      />
                    </Button>
                    <TextField
                      fullWidth
                      placeholder="Or type skills (e.g. Python, React)"
                      value={manualSkills}
                      onChange={(e) => setManualSkills(e.target.value)}
                      size="medium"
                      label="Technical Skills"
                      sx={{ mb: 2 }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth label="CGPA (e.g. 4.5)"
                          value={customCgpa}
                          onChange={e => setCustomCgpa(e.target.value)}
                          type="number" step="0.1"
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth label="Level (e.g. 400)"
                          value={customLevel}
                          onChange={e => setCustomLevel(e.target.value)}
                          type="number" step="100"
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth label="Preferred Sector"
                          placeholder="e.g. Technology"
                          value={customSector}
                          onChange={e => setCustomSector(e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth label="Preferred Location"
                          placeholder="e.g. Lagos"
                          value={customLocation}
                          onChange={e => setCustomLocation(e.target.value)}
                        />
                      </Grid>
                    </Grid>
                  </Grid>

                  <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 1 }}>
                    <Button onClick={() => setShowCustomMatch(false)} color="inherit">
                      Cancel
                    </Button>
                    <Button
                      variant="contained"
                      onClick={handleCustomMatch}
                      disabled={(!resumeFile && !manualSkills.trim() && !customCgpa && !customSector) || matching}
                      startIcon={matching ? <CircularProgress size={16} color="inherit" /> : <AutoFixHigh />}
                    >
                      {matching ? 'Calculating Detailed Match...' : 'Generate Matches'}
                    </Button>
                  </Grid>
                </Grid>
              </Paper>
            </Collapse>

            {/* Recommendations Section */}
            {filteredRecs.length > 0 && (
              <Box sx={{ mb: 8 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Star sx={{ mr: 1, color: '#F59E0B' }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>Recommended for you</Typography>
                  </Box>
                  {extractedSkills?.length > 0 && (
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      <Typography variant="caption" sx={{ alignSelf: 'center', mr: 1 }}>Detected Skills:</Typography>
                      {extractedSkills.map(s => <Chip key={s} label={s} size="small" variant="outlined" color="primary" />)}
                    </Box>
                  )}
                </Box>
                <Grid container spacing={3}>
                  {filteredRecs.map((rec) => (
                    <Grid item xs={12} sm={6} md={4} key={rec.opportunity.id}>
                      <Paper
                        sx={{
                          p: 3,
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          transition: 'all 0.2s',
                          borderColor: 'primary.main',
                          borderWidth: 1.5,
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: '0 12px 20px -10px rgba(0,0,0,0.1)',
                          },
                        }}
                      >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Chip
                      label={`${rec.match_score}% Match`}
                      size="small"
                      sx={{
                        bgcolor: 'primary.main',
                        color: 'white',
                        fontWeight: 600,
                        fontSize: '0.75rem'
                      }}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                      {rec.opportunity.sector}
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', gap: 0.5, height: 4, mb: 0.5, borderRadius: 2, overflow: 'hidden' }}>
                      <Box sx={{ width: `${rec.breakdown.ml_model_weight}%`, bgcolor: 'primary.main', opacity: 0.8 }} />
                      <Box sx={{ width: `${rec.breakdown.skill_match_weight}%`, bgcolor: '#10B981' }} />
                      <Box sx={{ width: `${rec.breakdown.preference_weight}%`, bgcolor: '#F59E0B' }} />
                    </Box>
                    <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'text.secondary', display: 'flex', gap: 1 }}>
                      <span>● ML</span>
                      <span>● Skills</span>
                      <span>● Prefs</span>
                    </Typography>
                  </Box>
                  <Typography variant="h6" gutterBottom sx={{ lineHeight: 1.3, mb: 1, fontWeight: 600 }}>
                    {rec.opportunity.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Business sx={{ fontSize: 16 }} /> {rec.opportunity.organization_name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <LocationOn sx={{ fontSize: 16 }} /> {rec.opportunity.location_state}
                  </Typography>

                  <Box sx={{ mb: 3 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.65rem', display: 'block', mb: 1 }}>
                      Why you matched
                    </Typography>

                    {rec.explanations?.length > 0 && (
                      <Box component="ul" sx={{ mt: 0, mb: 2, pl: 2, fontSize: '0.75rem', color: 'text.secondary' }}>
                        {rec.explanations.map((exp, i) => (
                          <li key={i}>{exp}</li>
                        ))}
                      </Box>
                    )}

                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1.5 }}>
                      {rec.matched_skills?.slice(0, 3).map(skill => (
                        <Chip key={skill} label={skill} size="small" sx={{ height: 20, fontSize: '0.65rem', bgcolor: '#DCFCE7', color: '#166534', fontWeight: 600, border: 'none' }} />
                      ))}
                      {rec.matched_skills?.length > 3 && (
                        <Typography variant="caption" sx={{ ml: 0.5 }}>+{rec.matched_skills.length - 3} more</Typography>
                      )}
                    </Box>

                    {rec.missing_skills?.length > 0 && (
                      <>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.65rem', display: 'block', mb: 1 }}>
                          Growth Areas To Note
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {rec.missing_skills?.slice(0, 2).map(skill => (
                            <Chip key={skill} label={skill} size="small" sx={{ height: 20, fontSize: '0.65rem', bgcolor: '#FEF3C7', color: '#92400E', fontWeight: 600, border: 'none' }} />
                          ))}
                        </Box>
                      </>
                    )}
                  </Box>

                  <Box sx={{ mt: 'auto' }}>
                    <Button fullWidth variant="contained" onClick={() => handleApplyClick(rec.opportunity)} endIcon={<ArrowForward sx={{ fontSize: 16 }} />}>
                      View Details
                    </Button>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

            {/* All Opportunities Section */}
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>All Opportunities</Typography>
              <Typography variant="body2" color="text.secondary">{filteredOpps.length} results</Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {filteredOpps.map((opp) => (
                <Paper
                  key={opp.id}
                  sx={{
                    p: 2.5,
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    gap: 3,
                    transition: 'all 0.2s',
                    '&:hover': {
                      borderColor: 'primary.main',
                      backgroundColor: 'rgba(17, 24, 39, 0.01)',
                    },
                  }}
                >
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                      {opp.title}
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Business sx={{ fontSize: 14 }} /> {opp.organization_name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <LocationOn sx={{ fontSize: 14 }} /> {opp.location_state}
                      </Typography>
                      <Chip label={opp.sector} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.7rem' }} />
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: { xs: '100%', sm: 'auto' }, justifyContent: 'flex-end' }}>
                    <Typography variant="caption" color="text.secondary">
                      {opp.slots_available} slots left
                    </Typography>
                    <Button variant="outlined" size="small" onClick={() => handleApplyClick(opp)} sx={{ borderRadius: 2 }}>
                      View details
                    </Button>
                  </Box>
                </Paper>
              ))}
              {filteredOpps.length === 0 && (
                <Paper sx={{ p: 6, textAlign: 'center', borderStyle: 'dashed' }}>
                  <Typography color="text.secondary">No opportunities found matching your criteria.</Typography>
                </Paper>
              )}
            </Box>
          </>
        )}

        {/* Saved Jobs Tab */}
        {activeTab === 1 && (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
              <BookmarkBorder sx={{ color: 'primary.main', fontSize: 28 }} />
              <Box>
                <Typography variant="h5" fontWeight={700}>Saved Jobs</Typography>
                <Typography variant="body2" color="text.secondary">
                  {savedOpportunities.length} job{savedOpportunities.length !== 1 ? 's' : ''} saved for later
                </Typography>
              </Box>
            </Box>

            {savedOpportunities.length > 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {savedOpportunities.map((opp) => (
                  <Paper
                    key={opp.id}
                    sx={{
                      p: 3,
                      display: 'flex',
                      flexDirection: { xs: 'column', sm: 'row' },
                      alignItems: { xs: 'flex-start', sm: 'center' },
                      gap: 3,
                      transition: 'all 0.2s',
                      border: '1px solid',
                      borderColor: 'primary.main',
                      bgcolor: 'rgba(59, 130, 246, 0.02)',
                      '&:hover': {
                        backgroundColor: 'rgba(59, 130, 246, 0.04)',
                      },
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                        {opp.title}
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', mb: 1 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Business sx={{ fontSize: 16 }} /> {opp.organization_name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <LocationOn sx={{ fontSize: 16 }} /> {opp.location_state}
                        </Typography>
                        <Chip label={opp.sector} size="small" variant="outlined" />
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                        {opp.description?.length > 150 ? `${opp.description.substring(0, 150)}...` : opp.description}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: { xs: 'stretch', sm: 'flex-end' } }}>
                      <Button 
                        variant="contained" 
                        onClick={() => handleApplyClick(opp)} 
                        sx={{ borderRadius: 2 }}
                        fullWidth={false}
                      >
                        Apply Now
                      </Button>
                      <Button 
                        variant="outlined" 
                        onClick={() => toggleSaved(opp.id)}
                        startIcon={<BookmarkBorder />}
                        sx={{ borderRadius: 2 }}
                        fullWidth={false}
                      >
                        Remove
                      </Button>
                    </Box>
                  </Paper>
                ))}
              </Box>
            ) : (
              <Paper sx={{ p: 6, textAlign: 'center', borderStyle: 'dashed' }}>
                <BookmarkBorder sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No saved jobs yet
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Save jobs you're interested in to view them here later
                </Typography>
                <Button variant="contained" onClick={() => setActiveTab(0)}>
                  Browse Jobs
                </Button>
              </Paper>
            )}
          </Box>
        )}

        {/* Following Tab */}
        {activeTab === 2 && (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
              <FavoriteBorder sx={{ color: 'primary.main', fontSize: 28 }} />
              <Box>
                <Typography variant="h5" fontWeight={700}>Following</Typography>
                <Typography variant="body2" color="text.secondary">
                  {followedOrganizations.length} compan{followedOrganizations.length !== 1 ? 'ies' : 'y'} you're following
                </Typography>
              </Box>
            </Box>

            {followedOrganizations.length > 0 ? (
              <Grid container spacing={3}>
                {followedOrganizations.map((org) => (
                  <Grid item xs={12} md={6} key={org.id}>
                    <Paper
                      sx={{
                        p: 3,
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'all 0.2s',
                        border: '1px solid',
                        borderColor: 'primary.main',
                        bgcolor: 'rgba(59, 130, 246, 0.02)',
                        '&:hover': {
                          backgroundColor: 'rgba(59, 130, 246, 0.04)',
                        },
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          <Business />
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" fontWeight={600}>
                            {org.company_name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {org.industry_sector} • {org.state}
                          </Typography>
                        </Box>
                        {org.verified && (
                          <Verified sx={{ color: 'primary.main' }} />
                        )}
                      </Box>

                      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, lineHeight: 1.5 }}>
                        {org.description?.length > 120 ? `${org.description.substring(0, 120)}...` : org.description || 'No description available.'}
                      </Typography>

                      <Box sx={{ mt: 'auto', display: 'flex', gap: 1 }}>
                        <Button 
                          variant="outlined" 
                          onClick={() => toggleFollow(org.id)}
                          startIcon={<Favorite />}
                          sx={{ borderRadius: 2, flex: 1 }}
                        >
                          Unfollow
                        </Button>
                        <Button 
                          variant="contained"
                          onClick={() => {
                            // Filter opportunities by this organization and switch to discover tab
                            setActiveTab(0);
                            // Could add filtering logic here
                          }}
                          sx={{ borderRadius: 2, flex: 1 }}
                        >
                          View Jobs
                        </Button>
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Paper sx={{ p: 6, textAlign: 'center', borderStyle: 'dashed' }}>
                <FavoriteBorder sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Not following any companies yet
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Follow companies to get updates on their new job postings
                </Typography>
                <Button variant="contained" onClick={() => setActiveTab(0)}>
                  Browse Companies
                </Button>
              </Paper>
            )}
          </Box>
        )}

        {/* My Applications Tab */}
        {activeTab === 3 && (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
              <HowToReg sx={{ color: 'primary.main', fontSize: 28 }} />
              <Box>
                <Typography variant="h5" fontWeight={700}>My Applications</Typography>
                <Typography variant="body2" color="text.secondary">
                  Track your internship applications and their status
                </Typography>
              </Box>
            </Box>

            {applications.length > 0 ? (
              <Grid container spacing={3}>
                {applications.map((app) => (
                  <Grid item xs={12} md={6} key={app.id}>
                    <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, mb: 2 }}>
                        <Box>
                          <Typography variant="h6" fontWeight={700}>{app.opportunity_details?.title || 'Application'}</Typography>
                          <Typography variant="body2" color="text.secondary">{app.opportunity_details?.organization_name || ''}</Typography>
                        </Box>
                        <Chip 
                          label={app.status} 
                          size="small" 
                          color={
                            app.status === 'accepted' ? 'success' : 
                            app.status === 'rejected' ? 'error' : 
                            app.status === 'under_review' ? 'warning' : 'default'
                          } 
                          variant="outlined" 
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Applied on {formatDate(app.applied_at)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, lineHeight: 1.5 }}>
                        {app.cover_letter?.length > 100 ? `${app.cover_letter.substring(0, 100)}...` : app.cover_letter}
                      </Typography>
                      <Button 
                        size="small" 
                        variant="outlined" 
                        startIcon={<Timeline />} 
                        onClick={() => openTimeline(app)}
                        sx={{ borderRadius: 2 }}
                      >
                        View Timeline
                      </Button>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Paper sx={{ p: 6, textAlign: 'center', borderStyle: 'dashed' }}>
                <HowToReg sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No applications yet
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Start applying to internships to track your progress here
                </Typography>
                <Button variant="contained" onClick={() => setActiveTab(0)}>
                  Browse Opportunities
                </Button>
              </Paper>
            )}
          </Box>
        )}

      {/* Opportunity Details Dialog */}
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        fullWidth
        maxWidth="md"
        PaperProps={{ sx: { borderRadius: 4 } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, pb: 1 }}>
          <Box>
            <Typography variant="h5" fontWeight={800}>{selectedOpp?.title}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {selectedOpp?.organization_name || 'Organization'} • {selectedOpp?.location_state || 'Nigeria'}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip
              size="small"
              label={getOpportunityFit(selectedOpp)}
              color={getOpportunityFit(selectedOpp) === 'Open' ? 'success' : 'warning'}
              variant="outlined"
            />
            {selectedOpp?.organization_verified && (
              <Chip size="small" icon={<Verified fontSize="small" />} label="Verified employer" color="primary" variant="outlined" />
            )}
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, mb: 2 }}>
                <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                  About this opportunity
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                  {selectedOpp?.description || 'No description provided.'}
                </Typography>
              </Paper>

              <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, mb: 2 }}>
                <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                  Role details
                </Typography>
                <Grid container spacing={1.5}>
                  {buildDetailRows(selectedOpp).map((item) => (
                    <Grid item xs={12} sm={6} key={item.label}>
                      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                        <Box sx={{ mt: 0.25, color: 'primary.main' }}>{item.icon}</Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">{item.label}</Typography>
                          <Typography variant="body2" fontWeight={600}>{item.value}</Typography>
                        </Box>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Paper>

              <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
                <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                  Required skills
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {(selectedOpp?.required_technical_skills || []).length > 0 ? (
                    selectedOpp.required_technical_skills.map((skill) => (
                      <Chip key={skill} label={skill} size="small" variant="outlined" />
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">No specific skills listed.</Typography>
                  )}
                </Box>

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                  Fit notes
                </Typography>
                <List dense disablePadding>
                  <ListItem disableGutters>
                    <ListItemIcon sx={{ minWidth: 32 }}><CheckCircle color="success" fontSize="small" /></ListItemIcon>
                    <ListItemText primary={`${selectedOpp?.slots_available || 0} slots available`} secondary="Capacity updates in real time when applications are accepted." />
                  </ListItem>
                  <ListItem disableGutters>
                    <ListItemIcon sx={{ minWidth: 32 }}><CalendarMonth color="primary" fontSize="small" /></ListItemIcon>
                    <ListItemText primary={`Deadline: ${formatDate(selectedOpp?.application_deadline)}`} secondary={selectedOpp?.application_deadline ? `${getDaysLeft(selectedOpp.application_deadline)} day(s) left` : 'No deadline provided.'} />
                  </ListItem>
                </List>
              </Paper>
            </Grid>

            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3, borderRadius: 3, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Quick apply
                </Typography>
                <Typography variant="h6" fontWeight={800} sx={{ mb: 1 }}>
                  {selectedOpp?.organization_name || 'Organization'}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Apply in a few steps. Write a strong cover letter, then submit once you're ready.
                </Typography>

                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<Send />}
                  onClick={handleBeginApplication}
                  disabled={!canApply}
                  sx={{ mb: 1.5, borderRadius: 2, py: 1.1 }}
                >
                  {canApply ? 'Apply now' : 'Application closed'}
                </Button>

                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={isSaved(selectedOpp) ? <BookmarkBorder /> : <BookmarkBorder />}
                  onClick={() => toggleSaved(selectedOpp?.id)}
                  sx={{ mb: 1.5, borderRadius: 2 }}
                  disabled={!selectedOpp}
                >
                  {isSaved(selectedOpp) ? 'Saved' : 'Save for later'}
                </Button>

                <Button
                  fullWidth
                  variant="text"
                  startIcon={isFollowing(selectedOpp) ? <Favorite /> : <FavoriteBorder />}
                  onClick={() => toggleFollow(selectedOpp?.organization)}
                  disabled={!selectedOpp}
                  sx={{ mb: 1.5, borderRadius: 2 }}
                >
                  {isFollowing(selectedOpp) ? 'Following company' : 'Follow company'}
                </Button>

                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5, lineHeight: 1.6 }}>
                  LinkedIn-style note: this app focuses on internship placement and direct applications rather than social networking or recruiter messaging.
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setDetailsOpen(false)} startIcon={<Close />}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={timelineOpen}
        onClose={() => setTimelineOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>
          Application timeline
          <Typography variant="body2" color="text.secondary">
            {timelineApplication?.opportunity_details?.title || 'Selected application'}
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          {timelineLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={28} />
            </Box>
          ) : timelineActivities.length > 0 ? (
            <Stack spacing={1.5}>
              {timelineActivities.map((item) => (
                <Paper key={item.id} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                  <Typography variant="subtitle2" fontWeight={700}>{item.title}</Typography>
                  <Typography variant="body2" color="text.secondary">{item.message}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatDate(item.created_at)}
                  </Typography>
                </Paper>
              ))}
            </Stack>
          ) : (
            <Typography color="text.secondary">No timeline events yet.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTimelineOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Application Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => !submitting && setOpenDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3, p: 1 }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6" fontWeight={800}>Submit application</Typography>
            <Typography variant="body2" color="text.secondary">
              {selectedOpp?.title} • {selectedOpp?.organization_name}
            </Typography>
          </Box>
          <Chip size="small" label={`${coverLetter.trim().length}/120+`} variant="outlined" />
        </DialogTitle>
        <DialogContent>
          {success && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>{success}</Alert>}
          {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

          <Paper variant="outlined" sx={{ p: 2.2, borderRadius: 3, mb: 3, bgcolor: 'rgba(59, 130, 246, 0.03)' }}>
            <Typography variant="subtitle2" fontWeight={700} gutterBottom>
              Before you submit
            </Typography>
            <DialogContentText component="div" sx={{ fontSize: '0.92rem' }}>
              Make this feel like a real LinkedIn application: be specific about your skills, what you can contribute, and why you want this role.
            </DialogContentText>
          </Paper>

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>Role</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{selectedOpp?.title}</Typography>
            <Typography variant="subtitle2" gutterBottom>Company</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{selectedOpp?.organization_name}</Typography>
            <Typography variant="subtitle2" gutterBottom>About the role</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
              {selectedOpp?.description}
            </Typography>
          </Box>

          <Divider sx={{ mb: 3 }} />

          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
            Cover Letter
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={5}
            placeholder="Share why you're a great fit for this internship. Mention relevant projects, coursework, tools, and what you want to learn."
            value={coverLetter}
            onChange={(e) => setCoverLetter(e.target.value)}
            disabled={submitting}
            helperText={`${coverLetter.trim().length} characters written • Minimum 120 characters`}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button onClick={() => setOpenDialog(false)} disabled={submitting} sx={{ color: 'text.secondary' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleApplySubmit}
            disabled={submitting || !coverLetter.trim()}
            sx={{ px: 4, borderRadius: 2 }}
          >
            {submitting ? <CircularProgress size={20} color="inherit" /> : 'Submit application'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default DiscoveryPage;
