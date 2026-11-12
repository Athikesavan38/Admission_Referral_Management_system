import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './components/NotificationCenter';
import { NotificationProvider } from './context/NotificationContext';
import ProtectedRoute from './components/ProtectedRoute';
import PageLoader from './components/PageLoader';
import ScrollToTop from './components/ScrollToTop';
import ScrollProgress from './components/ScrollProgress';
import AIChatbot from './components/AIChatbot';

// Lazy-loaded pages — each becomes its own JS chunk
const Login           = lazy(() => import('./pages/Login'));
const Register        = lazy(() => import('./pages/Register'));
const NotFound        = lazy(() => import('./pages/NotFound'));
const SubmitReferral  = lazy(() => import('./pages/SubmitReferral'));
const ReferralStatus  = lazy(() => import('./pages/ReferralStatus'));
const AdminDashboard    = lazy(() => import('./pages/dashboard/AdminDashboard'));
const ReferrerDashboard = lazy(() => import('./pages/dashboard/ReferrerDashboard'));
const Leaderboard       = lazy(() => import('./pages/Leaderboard'));

function Unauthorized() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f0f2f9] dark:bg-[#0f1117] text-center px-4">
      <div className="text-6xl mb-4">🚫</div>
      <h1 className="text-4xl font-black text-red-500">Access Denied</h1>
      <p className="mt-3 text-gray-500 dark:text-gray-400">You don't have permission to view this page.</p>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
        <ToastProvider>
        <BrowserRouter>
          <ScrollProgress />
          <Suspense fallback={<PageLoader />}>
            <ScrollToTop />
            <AIChatbot />
            <Routes>
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/unauthorized" element={<Unauthorized />} />

              <Route element={<ProtectedRoute />}>
                <Route path="/submit" element={<SubmitReferral />} />
                <Route path="/status" element={<ReferralStatus />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
              </Route>

              <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route path="/dashboard/admin" element={<AdminDashboard />} />
              </Route>

              <Route element={<ProtectedRoute allowedRoles={['student_referrer','faculty','alumni','external_consultant']} />}>
                <Route path="/dashboard/referrer" element={<ReferrerDashboard />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
        </ToastProvider>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
