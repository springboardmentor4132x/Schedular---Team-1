/**
 * roles/Marketing/index.jsx
 *
 * Marketing role router.
 * /marketing/dashboard → MarketingDashboard (full 10-section page)
 * Other routes         → fully implemented Module 5 & 6 pages.
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

// ── Module 5: Publishing ──────────────────────────────────────────────────
import PublishingDashboard from '../../modules/Publishing/PublishingDashboard';
import PublishingQueue     from '../../modules/Publishing/PublishingQueue';
import PublishingLogs      from '../../modules/Publishing/PublishingLogs';
import FailedPosts         from '../../modules/Publishing/FailedPosts';
import PlatformStatus      from '../../modules/Publishing/PlatformStatus';

// ── Module 6: Analytics sub-pages ────────────────────────────────────────
import AnalyticsDashboard  from '../../modules/Analytics/AnalyticsDashboard';
import ContentAnalytics    from '../../modules/Analytics/ContentAnalytics';
import AudienceAnalytics   from '../../modules/Analytics/AudienceAnalytics';
import CampaignAnalytics   from '../../modules/Analytics/CampaignAnalytics';
import PlatformComparison  from '../../modules/Analytics/PlatformComparison';
import PerformanceTrends   from '../../modules/Analytics/PerformanceTrends';

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

      {/* ── Module 5: Publishing ──────────────────────────────────────── */}
      <Route path="publishing"            element={<PublishingDashboard ownerType="marketing" />} />
      <Route path="publishing/queue"      element={<PublishingQueue     ownerType="marketing" />} />
      <Route path="publishing/logs"       element={<PublishingLogs      ownerType="marketing" />} />
      <Route path="publishing/failed"     element={<FailedPosts         ownerType="marketing" />} />
      <Route path="publishing/platforms"  element={<PlatformStatus      ownerType="marketing" />} />

      {/* ── Module 6: Analytics sub-pages ─────────────────────────────── */}
      <Route path="analytics/overview"    element={<AnalyticsDashboard  ownerType="marketing" />} />
      <Route path="analytics/content"     element={<ContentAnalytics    ownerType="marketing" />} />
      <Route path="analytics/audience"    element={<AudienceAnalytics   ownerType="marketing" />} />
      <Route path="analytics/campaigns"   element={<CampaignAnalytics   ownerType="marketing" />} />
      <Route path="analytics/platforms"   element={<PlatformComparison  ownerType="marketing" />} />
      <Route path="analytics/trends"      element={<PerformanceTrends   ownerType="marketing" />} />

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
