import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Box, Grid, Card, CardContent, CardActions,
  Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions,
  Chip, Alert, CircularProgress, InputAdornment, Paper, Divider, Collapse
} from '@mui/material';
import { Search, LocationOn, Business, Star, ArrowForward, UploadFile, AutoFixHigh } from '@mui/icons-material';
import api from '../services/api';

const DiscoveryPage = () => {
  const [opportunities, setOpportunities] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [selectedOpp, setSelectedOpp] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');

  // Custom ML Match State
  const [showCustomMatch, setShowCustomMatch] = useState(false);
  const [resumeFile, setResumeFile] = useState(null);
  const [manualSkills, setManualSkills] = useState('');
  const [matching, setMatching] = useState(false);
  const [extractedSkills, setExtractedSkills] = useState([]);

  useEffect(() => {
    fetchOpportunities();
  }, []);

  const fetchOpportunities = async () => {
    try {
      const [oppsRes, recsRes] = await Promise.all([
        api.get('placements/discovery/'),
        api.get('recommendations/')
      ]);
      setOpportunities(oppsRes.data);
      setRecommendations(recsRes.data.results || []);
    } catch (err) {
      setError('Failed to load opportunities');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyClick = (opp) => {
    setSelectedOpp(opp);
    setOpenDialog(true);
    setSuccess('');
    setError('');
  };

  const handleApplySubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      await api.post('placements/student/applications/', {
        opportunity: selectedOpp.id,
        cover_letter: coverLetter
      });
      setSuccess('Application submitted successfully!');
      setTimeout(() => setOpenDialog(false), 2000);
    } catch (err) {
      setError(err.response?.data?.non_field_errors?.[0] || 'Failed to submit application');
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
    return opp.title.toLowerCase().includes(term) ||
      opp.organization_name.toLowerCase().includes(term) ||
      opp.sector.toLowerCase().includes(term) ||
      opp.location_state.toLowerCase().includes(term);
  };

  const filteredRecs = recommendations.filter(rec => matchesSearch(rec.opportunity));
  const filteredOpps = opportunities.filter(opp => {
    const isRecommended = recommendations.some(rec => rec.opportunity.id === opp.id);
    if (isRecommended && !searchTerm) return false; // Hide recommendations from the main list unless searching

    return matchesSearch(opp);
  });

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
            <Grid item xs={12} md={5}>
              <Button
                variant="outlined"
                component="label"
                fullWidth
                startIcon={<UploadFile />}
                sx={{ py: 1.5, borderStyle: 'dashed', borderWidth: 2 }}
              >
                {resumeFile ? resumeFile.name : "Upload Resume (PDF)"}
                <input
                  type="file"
                  hidden
                  accept="application/pdf"
                  onChange={(e) => setResumeFile(e.target.files[0])}
                />
              </Button>
            </Grid>
            <Grid item xs={12} md={7}>
              <TextField
                fullWidth
                placeholder="Or type skills (e.g. Python, React, Data Analysis)"
                value={manualSkills}
                onChange={(e) => setManualSkills(e.target.value)}
                size="medium"
              />
            </Grid>
            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 1 }}>
              <Button onClick={() => setShowCustomMatch(false)} color="inherit">
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleCustomMatch}
                disabled={(!resumeFile && !manualSkills.trim()) || matching}
                startIcon={matching ? <CircularProgress size={16} color="inherit" /> : <AutoFixHigh />}
              >
                {matching ? 'Calculating...' : 'Generate Matches'}
              </Button>
            </Grid>
          </Grid>
        </Paper>
      </Collapse>

      {error && !openDialog && <Alert severity="error" sx={{ mb: 4, borderRadius: 2 }}>{error}</Alert>}
      {success && !openDialog && <Alert severity="success" sx={{ mb: 4, borderRadius: 2 }}>{success}</Alert>}

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
                      Matched Skills
                    </Typography>
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
                          Growth Areas
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
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={() => handleApplyClick(rec.opportunity)}
                      endIcon={<ArrowForward sx={{ fontSize: 16 }} />}
                    >
                      View Details
                    </Button>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

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
              <Button
                variant="outlined"
                size="small"
                onClick={() => handleApplyClick(opp)}
                sx={{ borderRadius: 2 }}
              >
                Apply
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

      {/* Application Dialog - Refactored as a modern side-drawer-like modal */}
      <Dialog
        open={openDialog}
        onClose={() => !submitting && setOpenDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3, p: 1 }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
          Apply to {selectedOpp?.organization_name}
        </DialogTitle>
        <DialogContent>
          {success && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>{success}</Alert>}
          {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>Role</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{selectedOpp?.title}</Typography>
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
            placeholder="Share why you're a great fit for this internship..."
            value={coverLetter}
            onChange={(e) => setCoverLetter(e.target.value)}
            disabled={submitting}
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
