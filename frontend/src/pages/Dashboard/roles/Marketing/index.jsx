/**
 * roles/Marketing/index.jsx
 *
 * Marketing role router.
 * /marketing/dashboard → MarketingDashboard (full 10-section page)
 * Other routes         → ComingSoon stubs (built in later prompts)
 */

import { Routes, Route, useNavigate } from 'react-router-dom';
import MarketingDashboard      from './MarketingDashboard';
import ClientsPage             from './Clients/ClientsPage';
import ClientWorkspace         from './Clients/ClientWorkspace';
import NotificationsPage       from '../../modules/Notifications/NotificationsPage';
import CampaignList            from '../../modules/Campaigns/CampaignList';
import CampaignDetails         from '../../modules/Campaigns/CampaignDetails';
import ContentList             from '../../modules/Content/ContentList';
import PublishingCalendar      from '../../modules/Content/PublishingCalendar';
import AnalyticsPage           from '../../modules/Analytics/AnalyticsPage';
import ReportsPage             from '../../modules/Reports/ReportsPage';

function MarketingCampaignRoutes() {
  const navigate = useNavigate();
  return (
    <Routes>
      <Route
        index
        element={
          <CampaignList
            onOpenDetails={(id) => navigate(id)}
          />
        }
      />
      <Route
        path=":campaignId"
        element={
          <CampaignDetails
            onBack={() => navigate(-1)}
          />
        }
      />
    </Routes>
  );
}

// ── Router ────────────────────────────────────────────────────────────────────
export default function MarketingPages() {
  return (
    <Routes>
      <Route index             element={<MarketingDashboard />} />
      <Route path="dashboard"  element={<MarketingDashboard />} />
      <Route path="clients"    element={<ClientsPage />} />
      <Route path="clients/:clientId/*" element={<ClientWorkspace />} />
      <Route path="notifications" element={<NotificationsPage />} />

      {/* Scoped to global Marketing workflows (aggregating / filtering active clients) */}
      <Route path="campaigns/*" element={<MarketingCampaignRoutes />} />
      <Route
        path="scheduling"
        element={
          <ContentList
            clientId={undefined}
            clientName={undefined}
            ownerType="marketing"
            ownerId="marketing-user-id"
          />
        }
      />
      <Route
        path="calendar"
        element={
          <PublishingCalendar
            clientId={undefined}
            clientName={undefined}
            ownerType="marketing"
            ownerId="marketing-user-id"
          />
        }
      />
      <Route
        path="analytics"
        element={
          <AnalyticsPage
            clientId={undefined}
            clientName={undefined}
            ownerType="marketing"
            ownerId="marketing-user-id"
          />
        }
      />
      <Route
        path="reports"
        element={
          <ReportsPage
            clientId={undefined}
            clientName={undefined}
            ownerType="marketing"
            ownerId="marketing-user-id"
          />
        }
      />
    </Routes>
  );
}
