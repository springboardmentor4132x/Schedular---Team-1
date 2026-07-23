/**
 * pages/Creator/index.jsx
 *
 * Creator role router.
 * /creator/dashboard → CreatorDashboard (full 10-section page)
 * Other routes       → ComingSoon stubs (built in later prompts)
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
  return (
    <Routes>
      <Route
        index
        element={
          <CampaignList
            ownerId="creator-user-id"
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
  return (
    <Routes>
      <Route index element={<CreatorDashboard />} />
      <Route path="dashboard" element={<CreatorDashboard />} />
      <Route path="campaigns/*" element={<CreatorCampaignRoutes />} />
      <Route
        path="scheduling"
        element={<ContentList ownerId="creator-user-id" ownerType="creator" clientId={null} />}
      />
      <Route
        path="posts"
        element={<MyPostsPage ownerId="creator-user-id" ownerType="creator" clientId={null} />}
      />
      <Route
        path="calendar"
        element={<PublishingCalendar ownerId="creator-user-id" ownerType="creator" clientId={null} />}
      />
      <Route
        path="notifications"
        element={<NotificationsPage />}
      />
      <Route
        path="analytics"
        element={<AnalyticsPage ownerId="creator-user-id" ownerType="creator" clientId={null} />}
      />
      {Object.entries(pages).map(([path, name]) => (
        <Route key={path} path={path} element={<PlaceholderPage name={name} />} />
      ))}
    </Routes>
  );
}
