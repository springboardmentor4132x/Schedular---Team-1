/**
 * roles/Business/index.jsx
 *
 * Business role router.
 * /business/dashboard → BusinessDashboard (full 10-section page)
 * Other routes        → ComingSoon stubs (built in later prompts)
 */

import { Routes, Route, useNavigate } from 'react-router-dom';
import PageContainer     from '../../components/PageContainer/PageContainer';
import ComingSoon        from '../../components/ComingSoon/ComingSoon';
import BusinessDashboard from './BusinessDashboard';
import MarketingTeamsPage from './MarketingTeams/MarketingTeamsPage';
import CampaignList from '../../modules/Campaigns/CampaignList';
import CampaignDetails from '../../modules/Campaigns/CampaignDetails';
import BusinessPostsPage from '../../modules/Content/BusinessPostsPage';
import AnalyticsPage from '../../modules/Analytics/AnalyticsPage';
import ReportsPage from '../../modules/Reports/ReportsPage';

// ── Placeholder stub pages ────────────────────────────────────────────────────
const STUB_PAGES = {};

function PlaceholderPage({ name }) {
  return (
    <PageContainer title={name} breadcrumb={['Business', name]}>
      <ComingSoon pageName={name} />
    </PageContainer>
  );
}

function BusinessCampaignRoutes() {
  const navigate = useNavigate();
  return (
    <Routes>
      <Route
        index
        element={
          <CampaignList
            clientId="nike"
            clientName="Nike"
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
  return (
    <Routes>
      <Route index                element={<BusinessDashboard />} />
      <Route path="dashboard"     element={<BusinessDashboard />} />
      <Route path="marketing-teams" element={<MarketingTeamsPage />} />
      <Route path="campaigns/*"   element={<BusinessCampaignRoutes />} />
      <Route path="scheduled"     element={<BusinessPostsPage mode="scheduled" businessClientId="nike" />} />
      <Route path="published"     element={<BusinessPostsPage mode="published" businessClientId="nike" />} />
      <Route path="analytics"     element={<AnalyticsPage ownerType="business" clientId="nike" clientName="Nike" readOnly={true} />} />
      <Route path="reports"       element={<ReportsPage ownerType="business" clientId="nike" clientName="Nike" readOnly={true} />} />
      {Object.entries(STUB_PAGES).map(([path, name]) => (
        <Route key={path} path={path} element={<PlaceholderPage name={name} />} />
      ))}
    </Routes>
  );
}
