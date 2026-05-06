import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Box, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Button, Alert, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
  Rating, Avatar, Grid, Chip, Divider
} from '@mui/material';
import { RateReview, Visibility, Person, Business, CheckCircle, History } from '@mui/icons-material';
import api from '../services/api';

const SupervisorDashboard = () => {
  const [placements, setPlacements] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [openEval, setOpenEval] = useState(false);
  const [selectedPlacement, setSelectedPlacement] = useState(null);
  const [evalFormData, setEvalFormData] = useState({
    evaluation_type: 'midterm',
    technical_competence: 3,
    professionalism: 3,
    communication: 3,
    teamwork: 3,
    problem_solving: 3,
    comments: ''
  });

  const [openReports, setOpenReports] = useState(false);
  const [studentReports, setStudentReports] = useState([]);

  useEffect(() => {
    fetchPlacements();
  }, []);

  const fetchPlacements = async () => {
    try {
      const [placementsRes, activityRes] = await Promise.all([
        api.get('placements/supervisor/placements/'),
        api.get('placements/activity/')
      ]);
      setPlacements(placementsRes.data);
      setActivities(activityRes.data);
    } catch (err) {
      setError('Failed to load assigned students');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEval = (placement) => {
    setSelectedPlacement(placement);
    setOpenEval(true);
  };

  const handleOpenReports = async (placementId) => {
    try {
      const response = await api.get(`supervision/reports/?placement=${placementId}`);
      setStudentReports(response.data);
      setOpenReports(true);
    } catch (err) {
      setError('Failed to load student reports');
    }
  };

  const handleReportAction = async (reportId, status, comment) => {
    try {
      await api.patch(`supervision/reports/${reportId}/action/`, { status, supervisor_comment: comment });
      setSuccess(`Report ${status} successfully!`);
      // Update local state
      setStudentReports(prev => prev.map(r => r.id === reportId ? { ...r, status, supervisor_comment: comment } : r));
    } catch (err) {
      setError('Failed to update report status');
    }
  };

  const handleEvalSubmit = async () => {
    try {
      await api.post('supervision/evaluations/', {
        ...evalFormData,
        placement: selectedPlacement.id
      });
      setSuccess('Evaluation submitted successfully!');
      setOpenEval(false);
    } catch (err) {
      setError('Failed to submit evaluation');
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
          Supervisor Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Review progress reports and evaluate performance for your assigned students.
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 4, borderRadius: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 4, borderRadius: 2 }}>{success}</Alert>}

      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 1 }}>
          <Person color="primary" />
          <Typography variant="h6" fontWeight={600}>Assigned Interns</Typography>
        </Box>
        <TableContainer component={Paper} sx={{ borderRadius: 3, overflow: 'hidden' }}>
          <Table>
            <TableHead sx={{ backgroundColor: 'rgba(17, 24, 39, 0.02)' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Student Name</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Placement</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {placements.map((p) => (
                <TableRow key={p.id} hover>
                  <TableCell sx={{ py: 2.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ width: 32, height: 32, fontSize: '0.8rem', bgcolor: 'primary.main' }}>
                        {(p.application_details?.student_details?.full_name || 'S')[0]}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" fontWeight={600}>
                          {p.application_details?.student_details?.full_name || 'Student'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {p.application_details?.student_details?.matric_number || 'N/A'}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      {p.application_details?.opportunity_details?.title || 'Intern'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Business sx={{ fontSize: 14 }} /> {p.application_details?.opportunity_details?.organization_name || 'Org'}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                      <Button
                        size="small" variant="outlined" startIcon={<Visibility />}
                        onClick={() => handleOpenReports(p.id)}
                        sx={{ borderRadius: 1.5 }}
                      >
                        Reports
                      </Button>
                      <Button
                        variant="contained" size="small" startIcon={<RateReview />}
                        onClick={() => handleOpenEval(p)}
                        sx={{ borderRadius: 1.5 }}
                      >
                        Evaluate
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
              {placements.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">No students assigned to you yet.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <Box sx={{ mt: 6 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <History color="primary" fontSize="small" />
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
      </Box>

      {/* Modern Evaluation Dialog */}
      <Dialog
        open={openEval}
        onClose={() => setOpenEval(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 4 } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Performance Evaluation</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ py: 1 }}>
            <Typography variant="body2" fontWeight={500} sx={{ mb: 1 }}>Evaluation period</Typography>
            <TextField
              fullWidth select value={evalFormData.evaluation_type}
              onChange={(e) => setEvalFormData({ ...evalFormData, evaluation_type: e.target.value })}
              sx={{ mb: 3 }}
            >
              <MenuItem value="midterm">Midterm Evaluation</MenuItem>
              <MenuItem value="final">Final Evaluation</MenuItem>
            </TextField>

            <Typography variant="subtitle2" fontWeight={700} gutterBottom sx={{ mb: 2 }}>Ratings (1-5)</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              {[
                { name: 'technical_competence', label: 'Technical Competence' },
                { name: 'professionalism', label: 'Professionalism' },
                { name: 'communication', label: 'Communication' },
                { name: 'teamwork', label: 'Teamwork' },
                { name: 'problem_solving', label: 'Problem Solving' },
              ].map((field) => (
                <Box key={field.name} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">{field.label}</Typography>
                  <Rating
                    value={evalFormData[field.name]}
                    onChange={(e, val) => setEvalFormData({ ...evalFormData, [field.name]: val })}
                  />
                </Box>
              ))}
            </Box>

            <Box sx={{ mt: 4 }}>
              <Typography variant="body2" fontWeight={500} sx={{ mb: 1 }}>Additional feedback</Typography>
              <TextField
                fullWidth multiline rows={4}
                placeholder="Share your thoughts on the student's performance..."
                value={evalFormData.comments}
                onChange={(e) => setEvalFormData({ ...evalFormData, comments: e.target.value })}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenEval(false)} sx={{ color: 'text.secondary' }}>Cancel</Button>
          <Button variant="contained" onClick={handleEvalSubmit}>Submit evaluation</Button>
        </DialogActions>
      </Dialog>

      {/* Enhanced Reports View Dialog */}
      <Dialog
        open={openReports}
        onClose={() => setOpenReports(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 4 } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Student Logbook History</DialogTitle>
        <DialogContent dividers sx={{ backgroundColor: 'rgba(17, 24, 39, 0.01)', minHeight: 400 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, py: 2 }}>
            {studentReports.map((report) => (
              <Paper key={report.id} sx={{ p: 4, borderRadius: 3, border: '1px solid rgba(0,0,0,0.05)' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                  <Box>
                    <Typography variant="h6" fontWeight={800}>Week {report.week_number}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Submitted on {new Date(report.submitted_at).toLocaleString()}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Chip 
                      label={report.status.replace('_', ' ').toUpperCase()} 
                      color={report.status === 'approved' ? 'success' : report.status === 'revision_requested' ? 'warning' : 'info'}
                      size="small"
                      sx={{ fontWeight: 700, borderRadius: 1.5 }}
                    />
                  </Box>
                </Box>

                <Grid container spacing={3}>
                  <Grid item xs={12} md={7}>
                    <Typography variant="subtitle2" fontWeight={700} color="primary" gutterBottom>Daily Logs</Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {report.daily_logs?.map((log) => (
                        <Box key={log.day} sx={{ p: 1.5, bgcolor: 'rgba(0,0,0,0.02)', borderRadius: 2 }}>
                          <Typography variant="caption" fontWeight={800} color="text.secondary">{log.day}</Typography>
                          <Typography variant="body2">{log.activity}</Typography>
                        </Box>
                      ))}
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={5}>
                    <Box sx={{ mb: 2.5 }}>
                      <Typography variant="subtitle2" fontWeight={700} color="primary" gutterBottom>Weekly Summary</Typography>
                      <Typography variant="body2">{report.weekly_summary}</Typography>
                    </Box>
                    <Box sx={{ mb: 2.5 }}>
                      <Typography variant="subtitle2" fontWeight={700} color="primary" gutterBottom>Skills Developed</Typography>
                      <Typography variant="body2">{report.skills_developed}</Typography>
                    </Box>
                    
                    <Divider sx={{ my: 2 }} />
                    
                    {report.status === 'pending' ? (
                      <Box>
                        <TextField
                          fullWidth size="small" multiline rows={2}
                          placeholder="Add a comment or feedback..."
                          id={`comment-${report.id}`}
                          sx={{ mb: 2 }}
                        />
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button 
                            fullWidth variant="contained" color="success" size="small"
                            onClick={() => handleReportAction(report.id, 'approved', document.getElementById(`comment-${report.id}`).value)}
                          >
                            Approve
                          </Button>
                          <Button 
                            fullWidth variant="outlined" color="warning" size="small"
                            onClick={() => handleReportAction(report.id, 'revision_requested', document.getElementById(`comment-${report.id}`).value)}
                          >
                            Request Revision
                          </Button>
                        </Box>
                      </Box>
                    ) : (
                      <Box sx={{ p: 2, bgcolor: 'rgba(0,0,0,0.03)', borderRadius: 2 }}>
                        <Typography variant="caption" fontWeight={800} color="text.secondary">Supervisor Feedback</Typography>
                        <Typography variant="body2" sx={{ fontStyle: 'italic', mt: 0.5 }}>
                          {report.supervisor_comment || 'No comment provided.'}
                        </Typography>
                      </Box>
                    )}
                  </Grid>
                </Grid>
              </Paper>
            ))}
            {studentReports.length === 0 && (
              <Box sx={{ py: 10, textAlign: 'center' }}>
                <Typography color="text.secondary">No reports submitted by this student yet.</Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenReports(false)} variant="outlined">Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default SupervisorDashboard;
