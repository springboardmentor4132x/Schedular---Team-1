import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';

// ── Public pages ──────────────────────────────────────────────────────────────
import LandingPage   from './pages/LandingPage/LandingPage';
import Login         from './pages/Login/Login';
import Register      from './pages/Register/Register';

// ── Legacy layout (shared pages: profile, connect-apps, settings) ─────────────
import ProfilePage   from './pages/Profile/ProfilePage';
import ConnectAppsPage from './pages/ConnectApps/ConnectAppsPage';
import SettingsPage  from './pages/Settings/SettingsPage';

// ── New role-based layout ─────────────────────────────────────────────────────
import DashboardLayout from './pages/Dashboard/DashboardLayout';
import RoleRedirect    from './pages/Dashboard/RoleRedirect';

import { ROLES } from './pages/Dashboard/shared/constants';
import RoleGuard from './components/RoleGuard/RoleGuard';

// ── Role page bundles (lazy-loaded via standard import is fine for now) ────────
import BusinessPages   from './pages/Dashboard/roles/Business/index';
import MarketingPages  from './pages/Dashboard/roles/Marketing/index';
import CreatorPages    from './pages/Dashboard/roles/Creator/index';
import AdminPages      from './pages/Dashboard/roles/Admin/index';

// ─────────────────────────────────────────────────────────────────────────────

/** Redirects unauthenticated users to /login. */
function ProtectedRoute({ children }) {
  const { user } = useApp();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

/** Redirects already-authenticated users away from /login and /register. */
function GuestRoute({ children }) {
  const { user } = useApp();
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* ── Public ──────────────────────────────────────────────────── */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login"    element={<GuestRoute><Login /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />

      {/* ── New role-based dashboard (DashboardLayout) ──────────────── */}
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        {/* /dashboard → redirect to role-specific home */}
        <Route path="/dashboard" element={<RoleRedirect />} />

        {/* Business routes */}
        <Route
          path="/business/*"
          element={
            <RoleGuard allowedRoles={[ROLES.BUSINESS]}>
              <BusinessPages />
            </RoleGuard>
          }
        />

        {/* Marketing routes */}
        <Route
          path="/marketing/*"
          element={
            <RoleGuard allowedRoles={[ROLES.MARKETING]}>
              <MarketingPages />
            </RoleGuard>
          }
        />

        {/* Creator routes */}
        <Route
          path="/creator/*"
          element={
            <RoleGuard allowedRoles={[ROLES.CREATOR]}>
              <CreatorPages />
            </RoleGuard>
          }
        />

        {/* Admin routes */}
        <Route
          path="/admin/*"
          element={
            <RoleGuard allowedRoles={[ROLES.ADMIN]} allowAdmin={true}>
              <AdminPages />
            </RoleGuard>
          }
        />

        {/* Shared pages — still inside DashboardLayout so Sidebar/Navbar render */}
        <Route path="/profile"      element={<ProfilePage />} />
        <Route path="/connect-apps" element={<ConnectAppsPage />} />
        <Route path="/settings"     element={<SettingsPage />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppRoutes />
      </AppProvider>
    </BrowserRouter>
  );
}
