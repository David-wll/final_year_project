import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, Box, Paper, TextField, Button, 
  Alert, CircularProgress, Divider, Accordion, AccordionSummary, 
  AccordionDetails, Grid, Chip, Tab, Tabs
} from '@mui/material';
import { ExpandMore, Send, History, EditNote, CheckCircle, Warning, PendingActions } from '@mui/icons-material';
import api from '../services/api';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const StudentReportsPage = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState(0);

  const [formData, setFormData] = useState({
    week_number: '',
    daily_logs: DAYS.map(day => ({ day, activity: '' })),
    weekly_summary: '',
    skills_developed: '',
    challenges: ''
  });

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await api.get('supervision/reports/');
      setReports(response.data);
    } catch (err) {
      setError('Failed to load progress reports');
    } finally {
      setLoading(false);
    }
  };

  const handleDailyLogChange = (index, value) => {
    const newLogs = [...formData.daily_logs];
    newLogs[index].activity = value;
    setFormData({ ...formData, daily_logs: newLogs });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      await api.post('supervision/reports/', formData);
      setSuccess('Weekly logbook submitted successfully!');
      setFormData({
        week_number: '',
        daily_logs: DAYS.map(day => ({ day, activity: '' })),
        weekly_summary: '',
        skills_developed: '',
        challenges: ''
      });
      fetchReports();
      setActiveTab(1); // Switch to history
    } catch (err) {
      setError(err.response?.data?.non_field_errors?.[0] || 'Failed to submit report. Ensure you have an active placement.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusChip = (status) => {
    switch (status) {
      case 'approved': return <Chip size="small" icon={<CheckCircle />} label="Approved" color="success" />;
      case 'revision_requested': return <Chip size="small" icon={<Warning />} label="Revision Required" color="warning" />;
      default: return <Chip size="small" icon={<PendingActions />} label="Pending Review" color="info" />;
    }
  };

  if (loading) return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
      <CircularProgress size={32} thickness={5} />
    </Box>
  );

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Box sx={{ mb: 6 }}>
        <Typography variant="h4" fontWeight={800} gutterBottom sx={{ letterSpacing: '-0.02em' }}>
          SIWES Logbook
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Document your daily activities and track your industrial training progress.
        </Typography>
      </Box>

      <Tabs 
        value={activeTab} 
        onChange={(e, v) => setActiveTab(v)} 
        sx={{ mb: 4, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab icon={<EditNote sx={{ mr: 1 }} />} label="Submit Weekly Report" iconPosition="start" />
        <Tab icon={<History sx={{ mr: 1 }} />} label="Logbook History" iconPosition="start" />
      </Tabs>

      {error && <Alert severity="error" sx={{ mb: 4, borderRadius: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 4, borderRadius: 2 }}>{success}</Alert>}

      {activeTab === 0 ? (
        <Paper sx={{ p: 4, borderRadius: 3 }}>
          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>Week Number</Typography>
                <TextField
                  fullWidth type="number" name="week_number"
                  value={formData.week_number} onChange={handleChange}
                  placeholder="e.g. 5" required
                />
              </Grid>
              
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" fontWeight={700} sx={{ mb: 3 }}>Daily Activity Logs</Typography>
                {formData.daily_logs.map((log, index) => (
                  <Box key={log.day} sx={{ mb: 3 }}>
                    <Typography variant="body2" fontWeight={600} color="primary" sx={{ mb: 1 }}>
                      {log.day}
                    </Typography>
                    <TextField
                      fullWidth multiline rows={2}
                      value={log.activity}
                      onChange={(e) => handleDailyLogChange(index, e.target.value)}
                      placeholder={`What did you do on ${log.day}?`}
                      required
                    />
                  </Box>
                ))}
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" fontWeight={700} sx={{ mb: 3 }}>Weekly Reflection</Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>Skills Developed</Typography>
                <TextField
                  fullWidth multiline rows={3} name="skills_developed"
                  value={formData.skills_developed} onChange={handleChange}
                  placeholder="New technologies or soft skills learned..."
                  required
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>Challenges & Blockers</Typography>
                <TextField
                  fullWidth multiline rows={3} name="challenges"
                  value={formData.challenges} onChange={handleChange}
                  placeholder="Any technical or logistical issues?"
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>Weekly Summary</Typography>
                <TextField
                  fullWidth multiline rows={4} name="weekly_summary"
                  value={formData.weekly_summary} onChange={handleChange}
                  placeholder="A brief overview of your accomplishments this week..."
                  required
                />
              </Grid>

              <Grid item xs={12} sx={{ mt: 2 }}>
                <Button 
                  type="submit" variant="contained" size="large"
                  startIcon={<Send />} disabled={submitting}
                  sx={{ borderRadius: 2, px: 4 }}
                >
                  {submitting ? 'Submitting...' : 'Finalize Weekly Report'}
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      ) : (
        <Box>
          {reports.map((report) => (
            <Accordion key={report.id} sx={{ mb: 2, borderRadius: '12px !important', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.08)', '&:before': { display: 'none' } }}>
              <AccordionSummary expandMoreIcon={<ExpandMore />}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', pr: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography fontWeight={700}>Week {report.week_number}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(report.submitted_at).toLocaleDateString()}
                    </Typography>
                  </Box>
                  {getStatusChip(report.status)}
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ bgcolor: 'rgba(0,0,0,0.01)', p: 4 }}>
                <Grid container spacing={4}>
                  <Grid item xs={12} md={7}>
                    <Typography variant="subtitle2" fontWeight={700} color="primary" gutterBottom>Daily Logs</Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {report.daily_logs.map((log) => (
                        <Box key={log.day}>
                          <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase' }}>
                            {log.day}
                          </Typography>
                          <Typography variant="body2">{log.activity}</Typography>
                        </Box>
                      ))}
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={5}>
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle2" fontWeight={700} color="primary" gutterBottom>Weekly Summary</Typography>
                      <Typography variant="body2">{report.weekly_summary}</Typography>
                    </Box>
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle2" fontWeight={700} color="primary" gutterBottom>Skills Developed</Typography>
                      <Typography variant="body2">{report.skills_developed}</Typography>
                    </Box>
                    {report.supervisor_comment && (
                      <Box sx={{ p: 2, bgcolor: 'rgba(25, 118, 210, 0.05)', borderRadius: 2, border: '1px solid rgba(25, 118, 210, 0.1)' }}>
                        <Typography variant="subtitle2" fontWeight={700} color="primary" gutterBottom>Supervisor Comment</Typography>
                        <Typography variant="body2" sx={{ fontStyle: 'italic' }}>"{report.supervisor_comment}"</Typography>
                      </Box>
                    )}
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          ))}
          {reports.length === 0 && (
            <Paper sx={{ p: 8, textAlign: 'center', borderRadius: 4, border: '1px dashed rgba(0,0,0,0.1)' }}>
              <Typography color="text.secondary">Your logbook history will appear here.</Typography>
            </Paper>
          )}
        </Box>
      )}
    </Container>
  );
};

export default StudentReportsPage;
