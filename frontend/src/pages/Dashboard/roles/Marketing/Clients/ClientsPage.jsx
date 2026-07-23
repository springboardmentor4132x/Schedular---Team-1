/**
 * ClientsPage.jsx
 *
 * Marketing Team view to see assigned client businesses and accept pending requests.
 * Clicking a client's "Open Workspace" navigates to their Client Workspace.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdSearch, MdPeople, MdFolderOpen, MdCheckCircle, MdLaunch } from 'react-icons/md';
import Avatar from '../../../components/Avatar/Avatar';
import PageContainer from '../../../components/PageContainer/PageContainer';
import StatsCard from '../../../components/StatsCard/StatsCard';
import SectionTitle from '../../../components/SectionTitle/SectionTitle';
import {
  INITIAL_MOCK_CLIENTS,
  INITIAL_PENDING_REQUESTS,
} from './mockData';
import './ClientsPage.css';

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

export default function ClientsPage() {
  const navigate = useNavigate();
  const [clients, setClients] = useState(INITIAL_MOCK_CLIENTS);
  const [pendingRequests, setPendingRequests] = useState(INITIAL_PENDING_REQUESTS);
  const [searchVal, setSearchVal] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  // Interactive Requests handling
  const handleAcceptRequest = (request) => {
    const newClient = {
      id: request.id,
      name: request.name,
      industry: request.industry,
      profileImage: request.profileImage,
      status: 'active',
      connectedPlatforms: ['instagram', 'facebook'],
      activeCampaigns: 0,
      scheduledPosts: 0,
      publishedPosts: 0,
      engagementRate: 0.0,
      lastActivity: 'Collaboration request approved just now',
    };
    
    setClients(prev => [newClient, ...prev]);
    setPendingRequests(prev => prev.filter(r => r.id !== request.id));
  };

  const handleDeclineRequest = (requestId) => {
    setPendingRequests(prev => prev.filter(r => r.id !== requestId));
  };

  // KPI Computations
  const activeCount = clients.filter(c => c.status === 'active').length;
  const totalCampaigns = clients.reduce((sum, c) => sum + c.activeCampaigns, 0);

  const kpis = [
    { title: 'Total Clients', value: clients.length.toString(), icon: <MdPeople />, trend: 'neutral' },
    { title: 'Active Clients', value: activeCount.toString(), icon: <MdCheckCircle />, trend: 'up' },
    { title: 'Pending Requests', value: pendingRequests.length.toString(), icon: <MdPeople />, trend: pendingRequests.length > 0 ? 'up' : 'neutral' },
    { title: 'Active Campaigns', value: totalCampaigns.toString(), icon: <MdFolderOpen />, trend: 'up' },
  ];

  // Filtering
  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchVal.toLowerCase()) || 
                          client.industry.toLowerCase().includes(searchVal.toLowerCase());
    const matchesStatus = filterStatus === 'All' || 
                          (filterStatus === 'Active' && client.status === 'active') ||
                          (filterStatus === 'Inactive' && client.status === 'inactive');
    return matchesSearch && matchesStatus;
  });

  return (
    <PageContainer
      title="Clients"
      description="Manage the businesses and brands assigned to your marketing workspace."
      breadcrumb={['Marketing', 'Clients']}
    >
      {/* Client Overview KPIs */}
      <div className="mc-stats-grid">
        {kpis.map((kpi) => (
          <StatsCard key={kpi.title} {...kpi} />
        ))}
      </div>

      {/* S1: Pending Requests List */}
      {pendingRequests.length > 0 && (
        <div className="mc-section">
          <SectionTitle
            title="Pending Client Requests"
            description="Businesses requesting management collaboration"
          />
          <div className="mc-requests-list">
            {pendingRequests.map((req) => (
              <div key={req.id} className="mc-request-item">
                <Avatar
                  profileImage={req.profileImage}
                  firstName={req.name}
                  lastName=""
                  size="md"
                />
                <div className="mc-request-item__info">
                  <h4 className="mc-request-item__name">{req.name}</h4>
                  <p className="mc-request-item__details">
                    Industry: <strong>{req.industry}</strong> • Request: <strong>{req.requestType}</strong>
                  </p>
                  <span className="mc-request-item__time">Requested {req.timeRequested}</span>
                </div>
                <div className="mc-request-item__actions">
                  <button
                    onClick={() => handleDeclineRequest(req.id)}
                    className="mc-request-btn mc-request-btn--decline"
                  >
                    Decline
                  </button>
                  <button
                    onClick={() => handleAcceptRequest(req)}
                    className="mc-request-btn mc-request-btn--accept"
                  >
                    Accept Request
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* S2: Clients Grid */}
      <div className="mc-section">
        <SectionTitle
          title="Assigned Clients"
          description="Brands currently managed by your workspace"
        />

        {/* Filter Toolbar */}
        <div className="mc-toolbar">
          <div className="mc-toolbar__search">
            <MdSearch className="mc-toolbar__search-icon" />
            <input
              type="text"
              placeholder="Search clients by name or industry..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              className="mc-toolbar__search-input"
            />
          </div>

          <div className="mc-toolbar__filters">
            {['All', 'Active', 'Inactive'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`mc-filter-btn${filterStatus === status ? ' mc-filter-btn--active' : ''}`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Clients Grid */}
        {filteredClients.length === 0 ? (
          <div className="mc-empty-state">
            <MdPeople size={48} className="mc-empty-state__icon" />
            <h3>No clients found</h3>
            <p>Try matching your search spelling or filters to display assigned brands.</p>
          </div>
        ) : (
          <div className="mc-clients-grid">
            {filteredClients.map((client) => (
              <div key={client.id} className="mc-client-card">
                <div className="mc-client-card__header">
                  <Avatar
                    profileImage={client.profileImage}
                    firstName={client.name}
                    lastName=""
                    size="md"
                  />
                  <div className="mc-client-card__title">
                    <h4 className="mc-client-card__name">{client.name}</h4>
                    <span className="mc-client-card__industry">{client.industry}</span>
                  </div>
                  <span className={`mc-client-card__status mc-client-status--${client.status}`}>
                    {client.status}
                  </span>
                </div>

                <div className="mc-client-card__stats">
                  <div className="mc-client-card__stat-item">
                    <span className="mc-client-card__stat-val">{client.activeCampaigns}</span>
                    <span className="mc-client-card__stat-lbl">Campaigns</span>
                  </div>
                  <div className="mc-client-card__stat-item">
                    <span className="mc-client-card__stat-val">{client.scheduledPosts}</span>
                    <span className="mc-client-card__stat-lbl">Scheduled</span>
                  </div>
                  <div className="mc-client-card__stat-item">
                    <span className="mc-client-card__stat-val">{client.publishedPosts}</span>
                    <span className="mc-client-card__stat-lbl">Published</span>
                  </div>
                </div>

                <div className="mc-client-card__platforms">
                  {client.connectedPlatforms.map((p) => (
                    <span
                      key={p}
                      className="mc-client-card__platform-icon"
                      style={{ background: PLATFORM_COLORS[p] }}
                      title={p}
                    >
                      {PLATFORM_CHARS[p]}
                    </span>
                  ))}
                </div>

                <p className="mc-client-card__activity" title={client.lastActivity}>
                  ⚡ {client.lastActivity}
                </p>

                <button
                  onClick={() => navigate(`/marketing/clients/${client.id}`)}
                  className="mc-client-card__btn"
                >
                  <MdLaunch /> Open Workspace
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
