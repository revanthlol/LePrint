// frontend/src/App.jsx
import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";

import { AuthProvider } from "./components/AuthProvider";
import { useAuth } from "./components/AuthProvider";
import { GuestProvider } from "./components/GuestContext";
import { NotificationProvider } from "./components/NotificationProvider";
import { Toaster } from 'sonner';
import { ProtectedRoute } from "./components/ProtectedRoute";
import { DashboardLayout } from "./components/Dashboard/DashboardLayout";
import { Login } from "./components/Login";
import { History } from "./components/Dashboard/History";
import { PrintInterface } from "./components/Print/PrintInterface";
import { FAQPage } from "./components/FAQPage";
import { AdminRoute } from "./components/Admin/AdminRoute";
import { AdminDashboard } from "./components/Admin/Admindashboard";
import PrivacyPolicy from "./components/PrivacyPolicy";
import Terms from "./components/Terms";
import RefundPolicy from "./components/RefundPolicy";
import Contact from "./components/Contact";
import About from "./components/About";
import Landing from "./components/Landing";

function RootRedirect() {
  const { currentUser, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading) return;

    // Priority 1: kiosk_id param — redirect to /app preserving params
    const params = location.search;
    if (new URLSearchParams(params).get('kiosk_id')) {
      navigate('/app' + params, { replace: true });
      return;
    }

    // Priority 2: logged-in user — send to app
    if (currentUser) {
      navigate('/app', { replace: true });
      return;
    }

    // Priority 3: show landing
  }, [currentUser, loading, navigate, location.search]);

  // Show nothing while auth is resolving, then show Landing
  if (loading) return null;
  if (!new URLSearchParams(location.search).get('kiosk_id') && !currentUser) {
    return <Landing />;
  }
  return null;
}

function LoginRoute() {
  const { currentUser, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (currentUser) navigate('/app', { replace: true });
  }, [currentUser, loading, navigate]);

  if (loading) return null;
  if (currentUser) return null;
  return <Login />;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <GuestProvider>
          <NotificationProvider>
            <Toaster
              theme="dark"
              position="bottom-right"
              toastOptions={{
                style: {
                  background: '#1a1a1a',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff',
                },
              }}
            />
          <Routes>
            {/* Root — smart redirect: kiosk QR → /app, logged in → /app, else Landing */}
            <Route path="/" element={<RootRedirect />} />

            {/* App — the kiosk print interface */}
            <Route
              path="/app"
              element={
                <ProtectedRoute>
                  <DashboardLayout activeTab="print">
                    <PrintInterface />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            {/* Auth */}
            <Route path="/login" element={<LoginRoute />} />

            {/* Dashboard */}
            <Route
              path="/history"
              element={
                <ProtectedRoute>
                  <DashboardLayout activeTab="history">
                    <History />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            {/* Admin */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <ProtectedRoute>
                    <DashboardLayout activeTab="admin">
                      <AdminDashboard />
                    </DashboardLayout>
                  </ProtectedRoute>
                </AdminRoute>
              }
            />

            {/* Public */}
            <Route path="/faq" element={<FAQPage />} />

            {/* App — FAQ inside DashboardLayout */}
            <Route
              path="/app/faq"
              element={
                <ProtectedRoute>
                  <DashboardLayout activeTab="faq">
                    <FAQPage inApp={true} />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/contact"
              element={
                <ProtectedRoute>
                  <DashboardLayout activeTab="contact">
                    <Contact inApp={true} />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/refund-policy" element={<RefundPolicy />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/about" element={<About />} />

            {/* /landing route removed — Landing is now at / */}
            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </NotificationProvider>
        </GuestProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
