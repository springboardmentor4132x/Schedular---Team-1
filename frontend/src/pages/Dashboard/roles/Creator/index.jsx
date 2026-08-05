/**
 * pages/Creator/index.jsx
 *
 * Creator role router.
 */

import { Routes, Route, useNavigate } from 'react-router-dom';
import PageContainer from '../../components/PageContainer/PageContainer';
import ComingSoon    from '../../components/ComingSoon/ComingSoon';
import CreatorDashboard from './CreatorDashboard';
import CampaignList from '../../modules/Campaigns/CampaignList';
import CampaignDetails from '../../modules/Campaigns/CampaignDetails';
import ContentList from '../../modules/Content/ContentList';
import MyPostsPage from '../../modules/Content/MyPostsPage';
import PublishingCalendar from '../../modules/Content/PublishingCalendar';
import NotificationsPage from '../../modules/Notifications/NotificationsPage';
import AnalyticsPage from '../../modules/Analytics/AnalyticsPage';
import { useApp } from '../../../../context/AppContext';

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

const pages = {};

function PlaceholderPage({ name }) {
  return (
    <PageContainer title={name} breadcrumb={['Creator', name]}>
      <ComingSoon pageName={name} />
    </PageContainer>
  );
}

function CreatorCampaignRoutes() {
  const navigate = useNavigate();
  const { user } = useApp();
  const creatorUserId = user?.id || null;
  return (
    <Routes>
      <Route
        index
        element={
          <CampaignList
            ownerId={creatorUserId}
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

export default function CreatorPages() {
  const { user } = useApp();
  const creatorUserId = user?.id || null;

  return (
    <Routes>
      <Route index element={<CreatorDashboard />} />
      <Route path="dashboard" element={<CreatorDashboard />} />
      <Route path="campaigns/*" element={<CreatorCampaignRoutes />} />
      <Route
        path="scheduling"
        element={<ContentList ownerId={creatorUserId} ownerType="creator" clientId={null} />}
      />
      <Route
        path="posts"
        element={<MyPostsPage ownerId={creatorUserId} ownerType="creator" clientId={null} />}
      />
      <Route
        path="calendar"
        element={<PublishingCalendar ownerId={creatorUserId} ownerType="creator" clientId={null} />}
      />
      <Route path="notifications" element={<NotificationsPage />} />
      <Route
        path="analytics"
        element={<AnalyticsPage ownerId={creatorUserId} ownerType="creator" clientId={null} />}
      />

      {/* ── Module 5: Publishing ──────────────────────────────────────── */}
      <Route path="publishing"           element={<PublishingDashboard ownerType="creator" />} />
      <Route path="publishing/queue"     element={<PublishingQueue     ownerType="creator" />} />
      <Route path="publishing/logs"      element={<PublishingLogs      ownerType="creator" />} />
      <Route path="publishing/failed"    element={<FailedPosts         ownerType="creator" />} />
      <Route path="publishing/platforms" element={<PlatformStatus      ownerType="creator" />} />

      {/* ── Module 6: Analytics sub-pages ─────────────────────────────── */}
      <Route path="analytics/overview"   element={<AnalyticsDashboard ownerType="creator" />} />
      <Route path="analytics/content"    element={<ContentAnalytics   ownerType="creator" />} />
      <Route path="analytics/audience"   element={<AudienceAnalytics  ownerType="creator" />} />
      <Route path="analytics/campaigns"  element={<CampaignAnalytics  ownerType="creator" />} />
      <Route path="analytics/platforms"  element={<PlatformComparison ownerType="creator" />} />
      <Route path="analytics/trends"     element={<PerformanceTrends  ownerType="creator" />} />
    </Routes>
  );
}
