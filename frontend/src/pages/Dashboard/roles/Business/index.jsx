/**
 * roles/Business/index.jsx
 *
 * Business role router.
 */

import { Routes, Route, useNavigate } from 'react-router-dom';
import { useApp } from '../../../../context/AppContext';
import BusinessDashboard from './BusinessDashboard';
import MarketingTeamsPage from './MarketingTeams/MarketingTeamsPage';
import CampaignList from '../../modules/Campaigns/CampaignList';
import CampaignDetails from '../../modules/Campaigns/CampaignDetails';
import BusinessPostsPage from '../../modules/Content/BusinessPostsPage';
import AnalyticsPage from '../../modules/Analytics/AnalyticsPage';
import ReportsPage from '../../modules/Reports/ReportsPage';

// ── Module 5: Publishing (view-only for Business) ─────────────────────────
import PublishingDashboard from '../../modules/Publishing/PublishingDashboard';
import PublishingLogs      from '../../modules/Publishing/PublishingLogs';
import PlatformStatus      from '../../modules/Publishing/PlatformStatus';

// ── Module 6: Analytics sub-pages ────────────────────────────────────────
import AnalyticsDashboard  from '../../modules/Analytics/AnalyticsDashboard';
import ContentAnalytics    from '../../modules/Analytics/ContentAnalytics';
import AudienceAnalytics   from '../../modules/Analytics/AudienceAnalytics';
import CampaignAnalytics   from '../../modules/Analytics/CampaignAnalytics';
import PlatformComparison  from '../../modules/Analytics/PlatformComparison';
import PerformanceTrends   from '../../modules/Analytics/PerformanceTrends';



function BusinessCampaignRoutes() {
  const navigate = useNavigate();
  const { user } = useApp();
  const businessClientId = user?.id || 'nike';
  const businessClientName = user?.orgName || user?.fullName || 'Nike';

  return (
    <Routes>
      <Route
        index
        element={
          <CampaignList
            clientId={businessClientId}
            clientName={businessClientName}
            readOnly={true}
            onOpenDetails={(id) => navigate(id)}
          />
        }
      />
      <Route
        path=":campaignId"
        element={
          <CampaignDetails
            readOnly={true}
            onBack={() => navigate(-1)}
          />
        }
      />
    </Routes>
  );
}

// ── Router ────────────────────────────────────────────────────────────────────
export default function BusinessPages() {
  const { user } = useApp();
  const businessClientId = user?.id || 'nike';
  const businessClientName = user?.orgName || user?.fullName || 'Nike';

  return (
    <Routes>
      <Route index                element={<BusinessDashboard />} />
      <Route path="dashboard"     element={<BusinessDashboard />} />
      <Route path="marketing-teams" element={<MarketingTeamsPage />} />
      <Route path="campaigns/*"   element={<BusinessCampaignRoutes />} />
      <Route path="scheduled"     element={<BusinessPostsPage mode="scheduled" businessClientId={businessClientId} />} />
      <Route path="published"     element={<BusinessPostsPage mode="published" businessClientId={businessClientId} />} />
      <Route path="analytics"     element={<AnalyticsPage ownerType="business" clientId={businessClientId} clientName={businessClientName} readOnly={true} />} />
      <Route path="reports"       element={<ReportsPage ownerType="business" clientId={businessClientId} clientName={businessClientName} readOnly={true} />} />

      {/* ── Module 5: Publishing (view-only for Business) ──────────────── */}
      <Route path="publishing"           element={<PublishingDashboard ownerType="business" />} />
      <Route path="publishing/logs"      element={<PublishingLogs      ownerType="business" />} />
      <Route path="publishing/platforms" element={<PlatformStatus      ownerType="business" />} />

      {/* ── Module 6: Analytics sub-pages ─────────────────────────────── */}
      <Route path="analytics/overview"   element={<AnalyticsDashboard ownerType="business" />} />
      <Route path="analytics/content"    element={<ContentAnalytics   ownerType="business" />} />
      <Route path="analytics/audience"   element={<AudienceAnalytics  ownerType="business" />} />
      <Route path="analytics/campaigns"  element={<CampaignAnalytics  ownerType="business" />} />
      <Route path="analytics/platforms"  element={<PlatformComparison ownerType="business" />} />
      <Route path="analytics/trends"     element={<PerformanceTrends  ownerType="business" />} />
    </Routes>
  );
}
