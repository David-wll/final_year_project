import React from 'react';
import { Box, Typography, Stack, Paper } from '@mui/material';

export const SimpleBarChart = ({ data, xKey, yKey, color = '#111827' }) => {
    if (!data || data.length === 0) return <Typography variant="body2" color="text.secondary">No data available</Typography>;

    const maxVal = Math.max(...data.map(d => d[yKey]));

    return (
        <Box sx={{ width: '100%', pt: 2 }}>
            <Stack spacing={2}>
                {data.map((item, i) => (
                    <Box key={i}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="caption" fontWeight={600}>{item[xKey]}</Typography>
                            <Typography variant="caption" color="text.secondary">{item[yKey]}</Typography>
                        </Box>
                        <Box sx={{ width: '100%', height: 8, bgcolor: 'rgba(17, 24, 39, 0.05)', borderRadius: 4, overflow: 'hidden' }}>
                            <Box
                                sx={{
                                    width: `${(item[yKey] / maxVal) * 100}%`,
                                    height: '100%',
                                    bgcolor: color,
                                    transition: 'width 1s ease-in-out',
                                    borderRadius: 4
                                }}
                            />
                        </Box>
                    </Box>
                ))}
            </Stack>
        </Box>
    );
};

export const SimplePieChart = ({ data, valueKey, labelKey }) => {
    if (!data || data.length === 0) return null;

    const total = data.reduce((acc, curr) => acc + curr[valueKey], 0);
    const colors = ['#111827', '#10B981', '#F59E0B', '#3B82F6', '#8B5CF6'];

    let currentPercentage = 0;

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Box sx={{ position: 'relative', width: 140, height: 140 }}>
                <svg viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)' }}>
                    {data.map((item, i) => {
                        const percentage = (item[valueKey] / total) * 100;
                        const strokeDasharray = `${percentage} ${100 - percentage}`;
                        const strokeDashoffset = -currentPercentage;
                        currentPercentage += percentage;

                        return (
                            <circle
                                key={i}
                                cx="18" cy="18" r="15.915"
                                fill="transparent"
                                stroke={colors[i % colors.length]}
                                strokeWidth="4"
                                strokeDasharray={strokeDasharray}
                                strokeDashoffset={strokeDashoffset}
                            />
                        );
                    })}
                </svg>
            </Box>
            <Stack spacing={1}>
                {data.map((item, i) => (
                    <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 12, height: 12, bgcolor: colors[i % colors.length], borderRadius: '50%' }} />
                        <Typography variant="caption" fontWeight={500}>
                            {item[labelKey]}: {((item[valueKey] / total) * 100).toFixed(0)}%
                        </Typography>
                    </Box>
                ))}
            </Stack>
        </Box>
    );
};

export const SimpleStatCard = ({ title, value, subtext, icon: Icon, color = 'primary.main' }) => (
    <Paper sx={{ p: 3, borderRadius: 4, height: '100%' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ p: 1, borderRadius: 2, bgcolor: `${color}10`, color: color }}>
                <Icon fontSize="small" />
            </Box>
        </Box>
        <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase' }}>
            {title}
        </Typography>
        <Typography variant="h4" fontWeight={800} sx={{ mt: 1 }}>
            {value}
        </Typography>
        {subtext && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                {subtext}
            </Typography>
        )}
    </Paper>
);
