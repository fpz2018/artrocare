import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/query-client';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { I18nProvider } from '@/i18n';
import { Toaster } from 'sonner';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import Layout from '@/Layout';

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
const HOOS12 = lazy(() => import('@/pages/HOOS12'));
const ResetPassword = lazy(() => import('@/pages/ResetPassword'));

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
function ProtectedRoute({ children, requiredRole }) {
  const { isAuthenticated, loading, profile } = useAuth();

  if (loading) return <PageLoader />;
  if (!isAuthenticated) return <Navigate to="/" replace />;

  // Role-based access control
  if (requiredRole && profile?.role !== requiredRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Layout>{children}</Layout>;
}

// Route configuration
function AppRoutes() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <PageLoader />;

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public routes */}
        <Route
          path="/"
          element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <Home />
          }
        />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Protected routes */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
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
        <Route path="/hoos12" element={<ProtectedRoute><HOOS12 /></ProtectedRoute>} />
        <Route path="/research" element={<ProtectedRoute requiredRole="therapist"><ResearchMonitor /></ProtectedRoute>} />
        <Route path="/admin/proposals" element={<ProtectedRoute requiredRole="admin"><ContentProposals /></ProtectedRoute>} />

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
          </AuthProvider>
        </I18nProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}