import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/query-client';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { I18nProvider } from '@/i18n';
import { Toaster } from 'sonner';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import Layout from '@/Layout';
import InstallPrompt from '@/components/InstallPrompt';

// Lazy load all pages for code splitting
const Home = lazy(() => import('@/pages/Home'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Progress = lazy(() => import('@/pages/Progress'));
const Exercises = lazy(() => import('@/pages/Exercises'));
const Goals = lazy(() => import('@/pages/Goals'));
const Nutrition = lazy(() => import('@/pages/Nutrition'));
const Supplements = lazy(() => import('@/pages/Supplements'));
const Medication = lazy(() => import('@/pages/Medication'));
const Therapist = lazy(() => import('@/pages/Therapist'));
const TherapistDashboard = lazy(() => import('@/pages/TherapistDashboard'));
const Library = lazy(() => import('@/pages/Library'));
const Premium = lazy(() => import('@/pages/Premium'));
const Settings = lazy(() => import('@/pages/Settings'));
const Community = lazy(() => import('@/pages/Community'));
const ResearchMonitor = lazy(() => import('@/pages/ResearchMonitor'));
const ContentProposals = lazy(() => import('@/pages/ContentProposals'));
const AdminPractices = lazy(() => import('@/pages/AdminPractices'));
const PracticeAdmin = lazy(() => import('@/pages/PracticeAdmin'));
const RegisterPractice = lazy(() => import('@/pages/RegisterPractice'));
const AcceptInvite = lazy(() => import('@/pages/AcceptInvite'));
const LandingPractice = lazy(() => import('@/pages/LandingPractice'));
const LandingPatient = lazy(() => import('@/pages/LandingPatient'));
const Login = lazy(() => import('@/pages/Login'));
const HOOS12 = lazy(() => import('@/pages/HOOS12'));
const ResetPassword = lazy(() => import('@/pages/ResetPassword'));
const Recipes = lazy(() => import('@/pages/Recipes'));
const Beweegplan = lazy(() => import('@/pages/Beweegplan'));
const AdminChecklist = lazy(() => import('@/pages/AdminChecklist'));

// Loading spinner component
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-white to-blue-50">
      <div className="flex flex-col items-center gap-3">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
        <p className="text-sm text-gray-500">Laden...</p>
      </div>
    </div>
  );
}

// Protected route wrapper
function ProtectedRoute({ children, requiredRole, noAdmin }) {
  const { isAuthenticated, loading, profile } = useAuth();

  if (loading) return <PageLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // Wait for profile before checking roles
  if ((requiredRole || noAdmin) && !profile) return <PageLoader />;

  // Redirect admin/practice_admin away from patient-only pages
  if (noAdmin && profile?.role === 'admin') {
    return <Navigate to="/admin/proposals" replace />;
  }
  if (noAdmin && profile?.role === 'practice_admin') {
    return <Navigate to="/practice" replace />;
  }
  if (noAdmin && profile?.role === 'therapist') {
    return <Navigate to="/therapist-dashboard" replace />;
  }

  // Role-based access control — redirect to role's home
  if (requiredRole && profile?.role !== requiredRole) {
    const home = profile?.role === 'admin'
      ? '/admin/proposals'
      : profile?.role === 'practice_admin'
      ? '/practice'
      : profile?.role === 'therapist'
      ? '/therapist-dashboard'
      : '/dashboard';
    return <Navigate to={home} replace />;
  }

  return <Layout>{children}</Layout>;
}

// Route configuration
function AppRoutes() {
  const { isAuthenticated, loading, profile } = useAuth();

  if (loading) return <PageLoader />;

  // Redirect based on role, default to /dashboard while profile loads
  const homeRedirect = !profile
    ? '/dashboard'
    : profile.role === 'admin'
    ? '/admin/proposals'
    : profile.role === 'practice_admin'
    ? '/practice'
    : profile.role === 'therapist'
    ? '/therapist-dashboard'
    : '/dashboard';

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Home />} />
        <Route
          path="/login"
          element={
            isAuthenticated
              ? homeRedirect
                ? <Navigate to={homeRedirect} replace />
                : <PageLoader />
              : <Login />
          }
        />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/register-practice" element={<RegisterPractice />} />
        <Route path="/voor-praktijken" element={<LandingPractice />} />
        <Route path="/voor-fysiotherapeuten" element={<Navigate to="/voor-praktijken" replace />} />
        <Route path="/voor-patienten" element={<LandingPatient />} />
        <Route path="/accept-invite" element={<AcceptInvite />} />
        <Route path="/beweegplan" element={<Beweegplan />} />

        {/* Protected routes */}
        <Route path="/dashboard" element={<ProtectedRoute noAdmin><Dashboard /></ProtectedRoute>} />
        <Route path="/progress" element={<ProtectedRoute><Progress /></ProtectedRoute>} />
        <Route path="/exercises" element={<ProtectedRoute><Exercises /></ProtectedRoute>} />
        <Route path="/goals" element={<ProtectedRoute><Goals /></ProtectedRoute>} />
        <Route path="/nutrition" element={<ProtectedRoute><Nutrition /></ProtectedRoute>} />
        <Route path="/supplements" element={<ProtectedRoute><Supplements /></ProtectedRoute>} />
        <Route path="/medication" element={<ProtectedRoute><Medication /></ProtectedRoute>} />
        <Route path="/therapist" element={<ProtectedRoute><Therapist /></ProtectedRoute>} />
        <Route path="/library" element={<ProtectedRoute><Library /></ProtectedRoute>} />
        <Route path="/premium" element={<ProtectedRoute><Premium /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/community" element={<ProtectedRoute><Community /></ProtectedRoute>} />
        <Route path="/recipes" element={<ProtectedRoute><Recipes /></ProtectedRoute>} />
        <Route path="/hoos12" element={<ProtectedRoute><HOOS12 /></ProtectedRoute>} />
        <Route path="/research" element={<ProtectedRoute requiredRole="therapist"><ResearchMonitor /></ProtectedRoute>} />
        <Route path="/admin/proposals" element={<ProtectedRoute requiredRole="admin"><ContentProposals /></ProtectedRoute>} />
        <Route path="/admin/practices" element={<ProtectedRoute requiredRole="admin"><AdminPractices /></ProtectedRoute>} />
        <Route path="/admin/checklist" element={<ProtectedRoute requiredRole="admin"><AdminChecklist /></ProtectedRoute>} />
        <Route path="/practice" element={<ProtectedRoute requiredRole="practice_admin"><PracticeAdmin /></ProtectedRoute>} />

        {/* Therapist-only route */}
        <Route
          path="/therapist-dashboard"
          element={
            <ProtectedRoute requiredRole="therapist">
              <TherapistDashboard />
            </ProtectedRoute>
          }
        />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <I18nProvider>
          <AuthProvider>
            <Router>
              <AppRoutes />
            </Router>
            <Toaster position="top-center" richColors closeButton />
              <InstallPrompt />
          </AuthProvider>
        </I18nProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}