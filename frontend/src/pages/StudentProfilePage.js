import React, { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Container, Typography, Box, Stepper, Step, StepLabel, Button,
  TextField, MenuItem, Chip, OutlinedInput, Select, FormControl,
  CircularProgress, Alert, Paper, Grid, Divider, LinearProgress
} from '@mui/material';
import { History, CheckCircle, School, Badge, EmojiObjects, Settings, CloudUpload, Edit } from '@mui/icons-material';
import api from '../services/api';

const steps = ['Resume', 'Identity', 'Academic', 'Skills', 'Preferences'];

const StudentProfilePage = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [applications, setApplications] = useState([]);
  const [activities, setActivities] = useState([]);
  const [resumeFile, setResumeFile] = useState(null);
  const [taxonomy, setTaxonomy] = useState({
    technical_skills: [],
    soft_skills: [],
    sectors: [],
    locations: []
  });

  const [formData, setFormData] = useState({
    full_name: '',
    matric_number: '',
    department: '',
    faculty: '',
    level: 100,
    cgpa: 0.0,
    course_of_study: '',
    technical_skills: [],
    soft_skills: [],
    preferred_sectors: [],
    preferred_locations: [],
    career_aspirations: '',
    portfolio_url: ''
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [profileRes, taxonomyRes, appsRes, activityRes] = await Promise.all([
        api.get('students/profile/'),
        api.get('students/taxonomy/'),
        api.get('placements/student/applications/'),
        api.get('placements/activity/')
      ]);

      if (profileRes.data) {
        const raw = profileRes.data;
        // Normalise skill arrays: API returns [{name, proficiency}] — flatten to strings
        const normalise = (arr) =>
          (arr || []).map(s => (typeof s === 'object' ? s.name : s));

        setFormData(prev => ({
          ...prev,
          ...raw,
          technical_skills: normalise(raw.technical_skills),
          soft_skills: normalise(raw.soft_skills),
          preferred_sectors: Array.isArray(raw.preferred_sectors) ? raw.preferred_sectors : [],
          preferred_locations: Array.isArray(raw.preferred_locations) ? raw.preferred_locations : [],
        }));
      }
      setTaxonomy(taxonomyRes.data);
      setApplications(appsRes.data);
      setActivities(activityRes.data);
    } catch (err) {
      setError('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleMultiSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleResumeChange = (e) => {
    setResumeFile(e.target.files[0]);
  };

  const handleResumeUpload = async () => {
    if (!resumeFile) return;
    setSaving(true);
    setError('');
    const uploadData = new FormData();
    uploadData.append('resume', resumeFile);

    try {
      const response = await api.patch('students/profile/', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFormData(prev => ({ ...prev, ...response.data }));
      setSuccess('Resume uploaded and parsed! We\'ve pre-filled some details for you.');
      setActiveStep(1); // Move to Identity step
    } catch (err) {
      setError('Failed to process resume');
    } finally {
      setSaving(false);
    }
  };

  const handleNext = () => setActiveStep((prev) => prev + 1);
  const handleBack = () => setActiveStep((prev) => prev - 1);

  const handleSubmit = async () => {
  setSaving(true);
  setError('');
  setSuccess('');
  try {
    
    const payload = {
      ...formData,
      // Re-wrap plain strings back to {name, proficiency} objects for the backend
      technical_skills: (formData.technical_skills || []).map(s =>
        typeof s === 'string' ? { name: s, proficiency: 'intermediate' } : s
      ),
      soft_skills: (formData.soft_skills || []).map(s =>
        typeof s === 'string' ? { name: s, proficiency: 'intermediate' } : s
      ),
      // Send null instead of empty string for URLField
      cgpa: parseFloat(formData.cgpa) || 0.0,
      level: parseInt(formData.level) || 100,
      portfolio_url: formData.portfolio_url || null,
    };
    await api.patch('students/profile/', payload);
    setSuccess('Profile updated successfully!');
    fetchInitialData();
  } catch (err) {
    setError('Failed to update profile. Please check all fields and try again.');
    console.error(err.response?.data); // shows exact validation errors in browser console
  } finally {
    setSaving(false);
  }
};

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
      <CircularProgress size={32} thickness={5} />
    </Box>
  );

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Grid container spacing={6}>
        {/* Left Side: Profile Builder */}
        <Grid item xs={12} md={7}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              {formData.full_name ? `Hi, ${formData.full_name.split(' ')[0]}` : 'Complete your profile'}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Upload your resume to auto-fill your profile or enter details manually.
            </Typography>
          </Box>

          <Paper sx={{ p: 4, borderRadius: 3 }}>
            <Stepper activeStep={activeStep} sx={{ mb: 6 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>
                    <Typography variant="caption" fontWeight={600}>{label}</Typography>
                  </StepLabel>
                </Step>
              ))}
            </Stepper>

            {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>{success}</Alert>}

            <Box sx={{ minHeight: 350 }}>
              {activeStep === 0 && (
                <Box textAlign="center" sx={{ py: 4 }}>
                  <Grid container spacing={3} sx={{ mt: 2 }}>
                    <Grid item xs={12} sm={6}>
                      <Paper
                        variant="outlined"
                        sx={{ p: 4, borderRadius: 4, borderStyle: 'dashed', borderWidth: 2, '&:hover': { bgcolor: 'rgba(17, 24, 39, 0.02)' } }}
                      >
                        <CloudUpload sx={{ fontSize: 40, color: 'primary.main', mb: 2 }} />
                        <Typography variant="h6" fontWeight={700}>Smart Sync</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                          Upload your PDF resume. We'll parse your skills and pre-fill your academic details.
                        </Typography>
                        <Button
                          component="label" variant="contained" fullWidth sx={{ borderRadius: 2 }}
                          disabled={saving}
                        >
                          {resumeFile ? resumeFile.name : 'Select Resume'}
                          <input type="file" hidden accept=".pdf" onChange={handleResumeChange} />
                        </Button>
                        {resumeFile && (
                          <Button
                            variant="outlined" fullWidth onClick={handleResumeUpload}
                            disabled={saving} sx={{ mt: 1.5, borderRadius: 2 }}
                          >
                            {saving ? 'Processing...' : 'Upload & Start'}
                          </Button>
                        )}
                      </Paper>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Paper
                        variant="outlined"
                        sx={{ p: 4, borderRadius: 4, height: '100%', '&:hover': { bgcolor: 'rgba(17, 24, 39, 0.02)' } }}
                      >
                        <Edit sx={{ fontSize: 40, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="h6" fontWeight={700}>Manual Entry</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                          Prefer to do it yourself? Skip the upload and enter your details step-by-step.
                        </Typography>
                        <Button
                          variant="outlined" fullWidth onClick={handleNext}
                          sx={{ borderRadius: 2 }}
                        >
                          Fill it manually
                        </Button>
                      </Paper>
                    </Grid>
                  </Grid>
                </Box>
              )}

              {activeStep === 1 && (
                <Box>
                  <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Badge fontSize="small" /> Personal Information
                  </Typography>
                  <Grid container spacing={2.5}>
                    <Grid item xs={12}>
                      <Typography variant="body2" fontWeight={500} sx={{ mb: 1 }}>Full name</Typography>
                      <TextField fullWidth name="full_name" value={formData.full_name} onChange={handleChange} placeholder="John Doe" />
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="body2" fontWeight={500} sx={{ mb: 1 }}>Matriculation number</Typography>
                      <TextField fullWidth name="matric_number" value={formData.matric_number} onChange={handleChange} placeholder="RUN/CMP/20/..." />
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="body2" fontWeight={500} sx={{ mb: 1 }}>Portfolio or LinkedIn URL</Typography>
                      <TextField fullWidth name="portfolio_url" value={formData.portfolio_url} onChange={handleChange} placeholder="https://..." />
                    </Grid>
                  </Grid>
                </Box>
              )}

              {activeStep === 2 && (
                <Box>
                  <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <School fontSize="small" /> Academic Background
                  </Typography>
                  <Grid container spacing={2.5}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" fontWeight={500} sx={{ mb: 1 }}>Faculty</Typography>
                      <TextField fullWidth name="faculty" value={formData.faculty} onChange={handleChange} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" fontWeight={500} sx={{ mb: 1 }}>Department</Typography>
                      <TextField fullWidth name="department" value={formData.department} onChange={handleChange} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" fontWeight={500} sx={{ mb: 1 }}>Level</Typography>
                      <TextField fullWidth select name="level" value={formData.level} onChange={handleChange}>
                        {[100, 200, 300, 400, 500].map(l => <MenuItem key={l} value={l}>{l}</MenuItem>)}
                      </TextField>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" fontWeight={500} sx={{ mb: 1 }}>Current CGPA</Typography>
                      <TextField fullWidth type="number" name="cgpa" inputProps={{ step: 0.01, min: 0, max: 5 }} value={formData.cgpa} onChange={handleChange} />
                    </Grid>
                  </Grid>
                </Box>
              )}

              {activeStep === 3 && (
                <Box>
                  <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EmojiObjects fontSize="small" /> Skills & Expertise
                  </Typography>
                  <FormControl fullWidth sx={{ mb: 3 }}>
                    <Typography variant="body2" fontWeight={500} sx={{ mb: 1 }}>Technical skills</Typography>
                    <Select
                      multiple value={formData.technical_skills}
                      onChange={(e) => handleMultiSelectChange('technical_skills', e.target.value)}
                      input={<OutlinedInput />}
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {selected.map((value) => <Chip key={value} label={value} size="small" />)}
                        </Box>
                      )}
                    >
                      {taxonomy.technical_skills.map((name) => (
                        <MenuItem key={name} value={name}>{name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl fullWidth>
                    <Typography variant="body2" fontWeight={500} sx={{ mb: 1 }}>Soft skills</Typography>
                    <Select
                      multiple value={formData.soft_skills}
                      onChange={(e) => handleMultiSelectChange('soft_skills', e.target.value)}
                      input={<OutlinedInput />}
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {selected.map((value) => <Chip key={value} label={value} size="small" />)}
                        </Box>
                      )}
                    >
                      {taxonomy.soft_skills.map((name) => (
                        <MenuItem key={name} value={name}>{name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              )}

              {activeStep === 4 && (
                <Box>
                  <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Settings fontSize="small" /> Preferences
                  </Typography>
                  <FormControl fullWidth sx={{ mb: 3 }}>
                    <Typography variant="body2" fontWeight={500} sx={{ mb: 1 }}>Preferred sectors</Typography>
                    <Select
                      multiple value={formData.preferred_sectors}
                      onChange={(e) => handleMultiSelectChange('preferred_sectors', e.target.value)}
                      input={<OutlinedInput />}
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {selected.map((value) => <Chip key={value} label={value} size="small" />)}
                        </Box>
                      )}
                    >
                      {taxonomy.sectors.map((name) => (
                        <MenuItem key={name} value={name}>{name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" fontWeight={500} sx={{ mb: 1 }}>Career aspirations</Typography>
                    <TextField fullWidth multiline rows={4} name="career_aspirations" value={formData.career_aspirations} onChange={handleChange} placeholder="Where do you see yourself in 5 years?" />
                  </Box>
                </Box>
              )}
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 6, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
              <Button disabled={activeStep === 0} onClick={handleBack} sx={{ color: 'text.secondary' }}>
                Back
              </Button>
              <Box>
                {activeStep === steps.length - 1 ? (
                  <Button variant="contained" onClick={handleSubmit} disabled={saving}>
                    {saving ? <CircularProgress size={20} color="inherit" /> : 'Save Profile'}
                  </Button>
                ) : (
                  <Button variant="contained" onClick={handleNext}>
                    Continue
                  </Button>
                )}
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Right Side: Completeness & Tracking */}
        <Grid item xs={12} md={5}>
          <Box sx={{ position: 'sticky', top: 100 }}>
            <Paper sx={{ p: 4, borderRadius: 3, mb: 4, backgroundColor: 'rgba(17, 24, 39, 0.02)', borderStyle: 'dashed' }}>
              <Typography variant="h6" gutterBottom>Profile Strength</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <LinearProgress
                  variant="determinate"
                  value={formData.profile_completeness}
                  sx={{ flexGrow: 1, height: 8, borderRadius: 4, backgroundColor: '#E5E7EB', '& .MuiLinearProgress-bar': { borderRadius: 4 } }}
                />
                <Typography variant="subtitle2" fontWeight={700}>{formData.profile_completeness}%</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                {formData.profile_completeness < 100
                  ? 'Complete your profile to unlock smarter recommendations.'
                  : 'Your profile is stellar! You are ready for top matches.'}
              </Typography>
              {formData.profile_completeness === 100 && (
                <Button
                  variant="contained"
                  fullWidth
                  sx={{ mt: 3, borderRadius: 2 }}
                  component={RouterLink}
                  to="/discovery"
                >
                  View ML Matches
                </Button>
              )}
            </Paper>

            <Paper sx={{ p: 3, borderRadius: 3, mb: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
                <History fontSize="small" color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>Recent Activity</Typography>
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

            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
              <History fontSize="small" color="primary" />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>Active Applications</Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {applications.filter(app => app.status !== 'accepted' && app.status !== 'rejected').map((app) => (
                <Paper key={app.id} sx={{ p: 2.5, borderRadius: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                    <Box>
                      <Typography variant="subtitle2" fontWeight={700}>
                        {app.opportunity_details?.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {app.opportunity_details?.organization_name}
                      </Typography>
                    </Box>
                    <Chip
                      label={app.status.toUpperCase()}
                      size="small"
                      sx={{
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        backgroundColor: 'rgba(17, 24, 39, 0.05)',
                        color: '#111827',
                      }}
                    />
                  </Box>
                  <Divider sx={{ my: 1.5 }} />
                  <Typography variant="caption" color="text.secondary">
                    Applied on {new Date(app.applied_at).toLocaleDateString()}
                  </Typography>
                </Paper>
              ))}

              <Box sx={{ display: 'flex', alignItems: 'center', mt: 4, mb: 2, gap: 1 }}>
                <CheckCircle fontSize="small" color="success" />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>Completed Internships</Typography>
              </Box>

              {applications.filter(app => app.status === 'accepted').map((app) => (
                <Paper key={app.id} sx={{ p: 2.5, borderRadius: 3, borderLeft: '4px solid #10B981' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="subtitle2" fontWeight={700}>
                        {app.opportunity_details?.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {app.opportunity_details?.organization_name}
                      </Typography>
                    </Box>
                    <Button
                      size="small" variant="contained" color="success"
                      onClick={() => navigate(`/feedback/${app.id}`)}
                      sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                    >
                      Give Feedback
                    </Button>
                  </Box>
                </Paper>
              ))}

              {applications.length === 0 && (
                <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3, backgroundColor: 'transparent' }}>
                  <Typography variant="body2" color="text.secondary">No applications yet.</Typography>
                  <Button variant="text" size="small" component={RouterLink} to="/discovery" sx={{ mt: 1 }}>Explore opportunities</Button>
                </Paper>
              )}
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
};

export default StudentProfilePage;
