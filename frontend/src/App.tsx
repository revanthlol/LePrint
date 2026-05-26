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
import ShippingPolicy from "./components/ShippingPolicy";
import HowItWorks from "./components/HowItWorks";
import Contact from "./components/Contact";
import About from "./components/About";
import Landing from "./components/Landing";
import ScrollToTop from "./components/ScrollToTop";
import MapPage from "./pages/MapPage";

function RootRedirect() {
  const { user, loading } = useAuth();
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
  }, [loading, navigate, location.search]);

  // Show nothing while auth is resolving, then show Landing
  if (loading) return null;
  
  // If we had a kiosk_id, the useEffect above would have navigated.
  // Otherwise, show the landing page.
  return <Landing />;
}

function LoginRoute() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (user) navigate('/app', { replace: true });
  }, [user, loading, navigate]);

  if (loading) return null;
  if (user) return null;
  return <Login />;
}

function MapRoute() {
  const { user, loading } = useAuth();
  
  if (loading) return null;
  
  if (user) {
    return (
      <ProtectedRoute>
        <DashboardLayout activeTab="map" noPadding hideFooter>
          <MapPage inApp={true} />
        </DashboardLayout>
      </ProtectedRoute>
    );
  }
  
  return <MapPage inApp={false} />;
}

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
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
            <Route path="/shipping-policy" element={<ShippingPolicy />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/about" element={<About />} />
            <Route path="/map" element={<MapRoute />} />

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
