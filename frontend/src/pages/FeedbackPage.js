import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Container, Typography, Box, Paper, TextField, Button,
    Rating, Grid, Chip, OutlinedInput, Select, MenuItem, FormControl,
    Alert, CircularProgress, Divider, Stack
} from '@mui/material';
import { Send, EmojiObjects } from '@mui/icons-material';
import api from '../services/api';
import { useCallback } from 'react';

const FeedbackPage = () => {
    const { applicationId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [application, setApplication] = useState(null);
    const [taxonomy, setTaxonomy] = useState({ technical_skills: [] });

    const [formData, setFormData] = useState({
        overall_rating: 5,
        would_recommend: true,
        skills_gaps: [],
        comments: ''
    });

    const fetchData = useCallback(async () => {
        try {
            // We need to find the placement associated with this application
            const [appsRes, taxRes] = await Promise.all([
                api.get('placements/student/applications/'),
                api.get('students/taxonomy/')
            ]);

            const app = appsRes.data.find(a => a.id === parseInt(applicationId));
            if (!app) {
                setError('Application not found. Please return to your profile.');
            } else if (!app.placement) {
                setError('No active placement found for this application. Feedback can only be submitted after a placement has been confirmed.');
            }
             else {
                setApplication(app);
            }
            setTaxonomy(taxRes.data);
        } catch (err) {
            setError('Failed to load data');
        } finally {
            setLoading(false);
        }
    }, [applicationId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        try {
            await api.post('placements/feedback/', {
                ...formData,
                placement: application.placement,
            });
            setSuccess('Thank you! Your feedback helps US improve recommendations.');
            setTimeout(() => navigate('/profile'), 2000);
        } catch (err) {
            setError('Failed to submit feedback. You may have already submitted feedback for this placement.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <Box display="flex" justifyContent="center" mt={10}><CircularProgress /></Box>;

    return (
        <Container maxWidth="md" sx={{ py: 8 }}>
            <Box sx={{ mb: 6, textAlign: 'center' }}>
                <Typography variant="h4" fontWeight={800} gutterBottom>
                    How was your internship?
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Your feedback helps our AI better match future students to {application?.opportunity_details?.organization_name}.
                </Typography>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>{success}</Alert>}

            <Paper sx={{ p: 4, borderRadius: 4 }}>
                <Box component="form" onSubmit={handleSubmit}>
                    <Grid container spacing={4}>
                        <Grid item xs={12} textAlign="center">
                            <Typography variant="h6" gutterBottom fontWeight={600}>Overall Rating</Typography>
                            <Rating
                                size="large"
                                value={formData.overall_rating}
                                onChange={(e, val) => setFormData({ ...formData, overall_rating: val })}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <Divider sx={{ mb: 2 }}>
                                <Chip label="Skill Gaps" icon={<EmojiObjects />} />
                            </Divider>
                            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mb: 3 }}>
                                Which skills did you feel were missing or could have prepared you better?
                            </Typography>
                            <FormControl fullWidth>
                                <Select
                                    multiple value={formData.skills_gaps}
                                    onChange={(e) => setFormData({ ...formData, skills_gaps: e.target.value })}
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
                        </Grid>

                        <Grid item xs={12}>
                            <Typography variant="h6" gutterBottom fontWeight={600}>Would you recommend this company?</Typography>
                            <Stack direction="row" spacing={2}>
                                <Button
                                    variant={formData.would_recommend ? 'contained' : 'outlined'}
                                    onClick={() => setFormData({ ...formData, would_recommend: true })}
                                    sx={{ borderRadius: 2, flex: 1 }}
                                >
                                    Yes, Absolutely
                                </Button>
                                <Button
                                    variant={!formData.would_recommend ? 'contained' : 'outlined'}
                                    color="error"
                                    onClick={() => setFormData({ ...formData, would_recommend: false })}
                                    sx={{ borderRadius: 2, flex: 1 }}
                                >
                                    Not Really
                                </Button>
                            </Stack>
                        </Grid>

                        <Grid item xs={12}>
                            <Typography variant="h6" gutterBottom fontWeight={600}>Any other comments?</Typography>
                            <TextField
                                fullWidth multiline rows={4}
                                placeholder="The team was great, but the training was minimal..."
                                value={formData.comments}
                                onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <Button
                                fullWidth size="large" variant="contained"
                                type="submit" disabled={submitting}
                                startIcon={<Send />}
                                sx={{ py: 2, borderRadius: 2, fontWeight: 700 }}
                            >
                                {submitting ? 'Submitting...' : 'Submit Post-Internship Feedback'}
                            </Button>
                        </Grid>
                    </Grid>
                </Box>
            </Paper>
        </Container>
    );
};

export default FeedbackPage;
