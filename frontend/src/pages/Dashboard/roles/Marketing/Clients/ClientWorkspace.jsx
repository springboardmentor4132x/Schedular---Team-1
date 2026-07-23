/**
 * ClientWorkspace.jsx
 *
 * Client Workspace wrapper. Displays workspace sub-navigation and maps
 * dynamic routes under /marketing/clients/:clientId.
 * Includes complete Client Workspace Dashboard overview (Overview tab).
 */

import { useParams, Routes, Route, useNavigate } from 'react-router-dom';
import {
  MdArrowBack, MdTrendingUp, MdCheckCircle, MdCampaign,
  MdSchedule, MdLaunch
} from 'react-icons/md';
import Avatar from '../../../components/Avatar/Avatar';
import PageContainer from '../../../components/PageContainer/PageContainer';
import StatsCard from '../../../components/StatsCard/StatsCard';
import ClientWorkspaceNav from './ClientWorkspaceNav';
import CampaignList from '../../../modules/Campaigns/CampaignList';
import CampaignDetails from '../../../modules/Campaigns/CampaignDetails';
import ContentList from '../../../modules/Content/ContentList';
import PublishingCalendar from '../../../modules/Content/PublishingCalendar';
import AnalyticsPage from '../../../modules/Analytics/AnalyticsPage';
import ReportsPage from '../../../modules/Reports/ReportsPage';
import { useState, useEffect } from 'react';
import { getClients } from '../../../../../services/teamService';
import './ClientWorkspace.css';

const PLATFORM_CHARS = {
  facebook: 'f',
  instagram: '📷',
  linkedin: 'in',
  youtube: '▶',
  x: '✕',
  pinterest: 'P',
};

const PLATFORM_COLORS = {
  facebook: '#1877F2',
  instagram: '#E1306C',
  linkedin: '#0A66C2',
  youtube: '#FF0000',
  x: '#0f172a',
  pinterest: '#E60023',
};


// ── S1-S6: Client Workspace Dashboard Page ──────────────────────────────────
function ClientWorkspaceDashboard({ client, workspace }) {
  if (!workspace) {
    return (
      <div className="cw-empty">
        <h3>Workspace inactive</h3>
        <p>No workspace setup or logs found for this client.</p>
      </div>
    );
  }

  // KPIs
  const kpiStats = [
    { title: 'Active Campaigns', value: workspace.activeCampaignsList.length.toString(), icon: <MdCampaign />, trend: 'neutral' },
    { title: 'Scheduled Posts', value: workspace.upcomingPosts.length.toString(), icon: <MdSchedule />, trend: 'up' },
    { title: 'Published Posts', value: client.publishedPosts.toString(), icon: <MdCheckCircle />, trend: 'up' },
    { title: 'Engagement Rate', value: `${client.engagementRate}%`, icon: <MdTrendingUp />, trend: 'up' },
  ];

  // Performance trends for snapshot
  const reachTrend = [45, 52, 68, 61, 74, 89, 94];

  return (
    <div className="cw-dashboard">
      {/* Overview Cards */}
      <div className="cw-kpi-grid">
        {kpiStats.map((kpi) => (
          <StatsCard key={kpi.title} {...kpi} />
        ))}
      </div>

      <div className="cw-columns">
        {/* Left Column (Primary updates) */}
        <div className="cw-col-primary">
          
          {/* Active Campaigns */}
          <div className="cw-card">
            <div className="cw-card__header">
              <h3 className="cw-card__title">Active Campaigns</h3>
            </div>
            <div className="cw-campaigns-list">
              {workspace.activeCampaignsList.length === 0 ? (
                <p className="cw-empty-msg">No active campaigns configured</p>
              ) : (
                workspace.activeCampaignsList.map((campaign) => (
                  <div key={campaign.id} className="cw-campaign-row">
                    <div className="cw-campaign-row__info">
                      <span className="cw-campaign-row__name">{campaign.name}</span>
                      <span className="cw-campaign-row__dates">
                        {campaign.startDate} to {campaign.endDate}
                      </span>
                    </div>
                    <div className="cw-campaign-row__progress">
                      <div className="cw-progress-bar">
                        <div className="cw-progress-fill" style={{ width: `${campaign.progress}%` }} />
                      </div>
                      <span className="cw-progress-pct">{campaign.progress}%</span>
                    </div>
                    <span className={`cw-campaign-row__status cw-status--${campaign.status}`}>
                      {campaign.status}
                    </span>
                    <button className="cw-campaign-row__btn">
                      <MdLaunch /> View
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Upcoming Scheduled Posts */}
          <div className="cw-card">
            <div className="cw-card__header">
              <h3 className="cw-card__title">Upcoming Posts</h3>
            </div>
            <div className="cw-posts-list">
              {workspace.upcomingPosts.length === 0 ? (
                <p className="cw-empty-msg">No upcoming publications scheduled</p>
              ) : (
                workspace.upcomingPosts.map((post) => (
                  <div key={post.id} className="cw-post-row">
                    <div
                      className="cw-post-row__platform"
                      style={{ background: PLATFORM_COLORS[post.platform] }}
                    >
                      {PLATFORM_CHARS[post.platform]}
                    </div>
                    <div className="cw-post-row__info">
                      <p className="cw-post-row__caption">{post.caption}</p>
                      <span className="cw-post-row__time">Scheduled for {post.time}</span>
                    </div>
                    <span className="cw-post-row__campaign">{post.campaign}</span>
                    <button className="cw-post-row__btn">View</button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recently Published */}
          <div className="cw-card">
            <div className="cw-card__header">
              <h3 className="cw-card__title">Recently Published</h3>
            </div>
            <div className="cw-published-list">
              {workspace.publishedPosts.map((post) => (
                <div key={post.id} className="cw-pub-row">
                  <div
                    className="cw-pub-row__platform"
                    style={{ background: PLATFORM_COLORS[post.platform] }}
                  >
                    {PLATFORM_CHARS[post.platform]}
                  </div>
                  <div className="cw-pub-row__info">
                    <p className="cw-pub-row__content">{post.content}</p>
                    <span className="cw-pub-row__time">Published {post.publishTime}</span>
                  </div>
                  <div className="cw-pub-row__metrics">
                    <div className="cw-pub-metric">
                      <span className="cw-pub-metric__val">{post.reach}</span>
                      <span className="cw-pub-metric__lbl">Reach</span>
                    </div>
                    <div className="cw-pub-metric">
                      <span className="cw-pub-metric__val">{post.engagement}</span>
                      <span className="cw-pub-metric__lbl">Engagement</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column (Insights / Timeline widgets) */}
        <div className="cw-col-secondary">
          
          {/* Performance Snapshot */}
          <div className="cw-card">
            <div className="cw-card__header">
              <h3 className="cw-card__title">Weekly Reach Trend</h3>
            </div>
            <div className="cw-snapshot-body">
              <div className="cw-mini-chart">
                {reachTrend.map((val, idx) => (
                  <div
                    key={idx}
                    className="cw-mini-chart__bar"
                    style={{ height: `${val}%` }}
                    title={`Day ${idx + 1}: ${val}%`}
                  />
                ))}
              </div>
              <div className="cw-mini-chart-labels">
                <span>Mon</span>
                <span>Sun</span>
              </div>
            </div>
          </div>

          {/* Timeline of recent workspace activity */}
          <div className="cw-card">
            <div className="cw-card__header">
              <h3 className="cw-card__title">Workspace Activity</h3>
            </div>
            <div className="cw-timeline">
              {workspace.activityTimeline.map((act) => (
                <div key={act.id} className="cw-timeline-item">
                  <div className="cw-timeline-dot" />
                  <div className="cw-timeline-content">
                    <p className="cw-timeline-text">{act.text}</p>
                    <span className="cw-timeline-time">{act.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function ClientCampaignRoutes({ client }) {
  const navigate = useNavigate();
  return (
    <Routes>
      <Route
        index
        element={
          <CampaignList
            clientId={client.id}
            clientName={client.name}
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

// ── Root Client Workspace Router/Wrapper ────────────────────────────────────
export default function ClientWorkspace() {
  const { clientId } = useParams();
  const navigate = useNavigate();

  const [client, setClient] = useState(null);
  
  useEffect(() => {
    getClients().then(clients => {
      const found = clients.find(c => String(c.id) === String(clientId));
      if (found) {
        setClient({
          id: found.id,
          name: found.name,
          industry: found.organization || 'Digital Marketing',
          profileImage: found.avatar_url || '',
          status: 'active',
          connectedPlatforms: ['facebook', 'instagram', 'linkedin', 'x', 'youtube'],
          publishedPosts: 0,
          engagementRate: 0.0,
        });
      }
    });
  }, [clientId]);

  if (!client) {
    return <PageContainer title="Loading Workspace..." breadcrumb={['Marketing', 'Clients', 'Loading']}><div className="cw-empty">Loading client workspace...</div></PageContainer>;
  }

  const workspace = {
    activeCampaignsList: [],
    upcomingPosts: [],
    publishedPosts: [],
    activityTimeline: [],
  };

  return (
    <PageContainer
      title={`${client.name} Workspace`}
      description={`Workspace overview and management center for ${client.name}.`}
      breadcrumb={['Marketing', 'Clients', client.name]}
    >
      {/* Workspace Header metadata */}
      <div className="cw-header-panel">
        <button
          onClick={() => navigate('/marketing/clients')}
          className="cw-back-btn"
        >
          <MdArrowBack /> Back to Clients
        </button>

        <div className="cw-header-panel__content">
          <Avatar
            profileImage={client.profileImage}
            firstName={client.name}
            lastName=""
            size="lg"
          />
          <div className="cw-header-panel__info">
            <div className="cw-header-panel__title-row">
              <h2 className="cw-header-panel__name">{client.name}</h2>
              <span className={`cw-header-panel__status cw-status--${client.status}`}>
                {client.status}
              </span>
            </div>
            <p className="cw-header-panel__meta">
              Industry: <strong>{client.industry}</strong>
            </p>
            <div className="cw-header-panel__platforms">
              {client.connectedPlatforms.map((p) => (
                <span
                  key={p}
                  className="cw-header-panel__platform"
                  style={{ background: PLATFORM_COLORS[p] }}
                  title={p}
                >
                  {PLATFORM_CHARS[p]}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Sub-Navigation */}
      <ClientWorkspaceNav clientId={client.id} />

      {/* Dynamic Sub-routing inside Workspace */}
      <Routes>
        <Route
          index
          element={<ClientWorkspaceDashboard client={client} workspace={workspace} />}
        />
        <Route
          path="campaigns/*"
          element={<ClientCampaignRoutes client={client} />}
        />
        <Route
          path="scheduling"
          element={
            <ContentList
              clientId={client.id}
              clientName={client.name}
              ownerType="marketing"
              ownerId="marketing-user-id"
            />
          }
        />
        <Route
          path="calendar"
          element={
            <PublishingCalendar
              clientId={client.id}
              clientName={client.name}
              ownerType="marketing"
              ownerId="marketing-user-id"
            />
          }
        />
        <Route
          path="analytics"
          element={
            <AnalyticsPage
              clientId={client.id}
              clientName={client.name}
              ownerType="marketing"
              ownerId="marketing-user-id"
            />
          }
        />
        <Route
          path="reports"
          element={
            <ReportsPage
              clientId={client.id}
              clientName={client.name}
              ownerType="marketing"
              ownerId="marketing-user-id"
            />
          }
        />
      </Routes>
    </PageContainer>
  );
}
