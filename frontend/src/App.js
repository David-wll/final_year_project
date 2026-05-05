import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './theme';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import StudentProfilePage from './pages/StudentProfilePage';
import OrganizationDashboard from './pages/OrganizationDashboard';
import CoordinatorDashboard from './pages/CoordinatorDashboard';
import DiscoveryPage from './pages/DiscoveryPage';
import StudentReportsPage from './pages/StudentReportsPage';
import SupervisorDashboard from './pages/SupervisorDashboard';
import FeedbackPage from './pages/FeedbackPage';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Navbar />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            <Route
              path="/profile"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentProfilePage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/reports"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentReportsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/discovery"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <DiscoveryPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedRoles={['organization']}>
                  <OrganizationDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/coordinator"
              element={
                <ProtectedRoute allowedRoles={['coordinator']}>
                  <CoordinatorDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/supervisor"
              element={
                <ProtectedRoute allowedRoles={['supervisor']}>
                  <SupervisorDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/feedback/:applicationId"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <FeedbackPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
