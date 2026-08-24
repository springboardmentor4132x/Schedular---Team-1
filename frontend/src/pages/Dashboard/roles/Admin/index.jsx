import { Routes, Route } from 'react-router-dom';
import AdminDashboard from './AdminDashboard';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminTeamsPage from './pages/AdminTeamsPage';
import AdminLogsPage from './pages/AdminLogsPage';

export default function AdminPages() {
  return (
    <Routes>
      <Route index element={<AdminDashboard />} />
      <Route path="dashboard" element={<AdminDashboard />} />
      <Route path="users" element={<AdminUsersPage />} />
      <Route path="teams" element={<AdminTeamsPage />} />
      <Route path="logs" element={<AdminLogsPage />} />
    </Routes>
  );
}
