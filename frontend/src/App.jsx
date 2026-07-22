import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';

import LandingPage    from './pages/LandingPage/LandingPage';
import Login          from './pages/Login/Login';
import Register       from './pages/Register/Register';

import AppLayout      from './pages/Dashboard/AppLayout';
import DashboardHome  from './pages/Dashboard/components/DashboardHome';
import ProfilePage    from './pages/Profile/ProfilePage';
import ConnectAppsPage from './pages/ConnectApps/ConnectAppsPage';
import SettingsPage   from './pages/Settings/SettingsPage';
import CreatePost from './pages/CreatePost/CreatePost';
import Drafts from "./pages/Drafts/Drafts";
import SchedulePosts from "./pages/SchedulePosts/SchedulePosts";
import Calendar from "./pages/Calendar/Calendar";

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
      {/* ── Public ────────────────────────────────────────── */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login"    element={<GuestRoute><Login /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />

      {/* ── Authenticated (shared layout) ─────────────────── */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard"    element={<DashboardHome />} />
        <Route path="/profile"      element={<ProfilePage />} />
        <Route path="/connect-apps" element={<ConnectAppsPage />} />
        <Route path="/settings"     element={<SettingsPage />} />
        <Route path="/create-post" element={<CreatePost />} />
        <Route path="/drafts" element={<Drafts />} />
        <Route path="/scheduled-posts" element={<SchedulePosts />} />
        <Route path="/calendar" element={<Calendar />} />
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
