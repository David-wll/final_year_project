import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, Box, Paper, TextField, Button, 
  Alert, CircularProgress, List, ListItem, ListItemText, 
  Divider, Accordion, AccordionSummary, AccordionDetails
} from '@mui/material';
import { ExpandMore, Send } from '@mui/icons-material';
import api from '../services/api';

const StudentReportsPage = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    week_number: '',
    tasks_completed: '',
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
      setSuccess('Report submitted successfully!');
      setFormData({ week_number: '', tasks_completed: '', skills_developed: '', challenges: '' });
      fetchReports();
    } catch (err) {
      setError(err.response?.data?.non_field_errors?.[0] || 'Failed to submit report. Make sure you have an active placement and haven\'t submitted for this week already.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Box display="flex" justifyContent="center" mt={4}><CircularProgress /></Box>;

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4 }}>
        <Typography variant="h4" gutterBottom>Weekly Progress Reports</Typography>
        
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>Submit New Report</Typography>
          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth label="Week Number" name="week_number" type="number"
              value={formData.week_number} onChange={handleChange} margin="normal" required
            />
            <TextField
              fullWidth multiline rows={3} label="Tasks Completed" name="tasks_completed"
              value={formData.tasks_completed} onChange={handleChange} margin="normal" required
              placeholder="What did you work on this week?"
            />
            <TextField
              fullWidth multiline rows={2} label="Skills Developed" name="skills_developed"
              value={formData.skills_developed} onChange={handleChange} margin="normal" required
              placeholder="What new skills did you acquire?"
            />
            <TextField
              fullWidth multiline rows={2} label="Challenges Faced" name="challenges"
              value={formData.challenges} onChange={handleChange} margin="normal" required
              placeholder="Any difficulties or blockers?"
            />
            <Button 
              type="submit" variant="contained" startIcon={<Send />} 
              disabled={submitting} sx={{ mt: 2 }}
            >
              {submitting ? 'Submitting...' : 'Submit Report'}
            </Button>
          </Box>
        </Paper>

        <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>Submission History</Typography>
        <Divider sx={{ mb: 2 }} />
        
        {reports.map((report) => (
          <Accordion key={report.id} sx={{ mb: 1 }}>
            <AccordionSummary expandMoreIcon={<ExpandMore />}>
              <Typography fontWeight="bold">Week {report.week_number}</Typography>
              <Typography sx={{ ml: 2, color: 'text.secondary' }}>
                Submitted on {new Date(report.submitted_at).toLocaleDateString()}
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="subtitle2" color="primary">Tasks Completed:</Typography>
              <Typography variant="body2" paragraph>{report.tasks_completed}</Typography>
              
              <Typography variant="subtitle2" color="primary">Skills Developed:</Typography>
              <Typography variant="body2" paragraph>{report.skills_developed}</Typography>
              
              <Typography variant="subtitle2" color="primary">Challenges:</Typography>
              <Typography variant="body2">{report.challenges}</Typography>
            </AccordionDetails>
          </Accordion>
        ))}

        {reports.length === 0 && (
          <Typography align="center" color="text.secondary" sx={{ py: 4 }}>
            No reports submitted yet.
          </Typography>
        )}
      </Box>
    </Container>
  );
};

export default StudentReportsPage;
