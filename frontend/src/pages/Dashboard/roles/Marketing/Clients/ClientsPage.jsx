/**
 * ClientsPage.jsx
 *
 * Marketing Team view to see assigned client businesses and accept pending requests.
 * Clicking a client's "Open Workspace" navigates to their Client Workspace.
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdSearch, MdPeople, MdFolderOpen, MdCheckCircle, MdLaunch } from 'react-icons/md';
import Avatar from '../../../components/Avatar/Avatar';
import PageContainer from '../../../components/PageContainer/PageContainer';
import StatsCard from '../../../components/StatsCard/StatsCard';
import SectionTitle from '../../../components/SectionTitle/SectionTitle';
import { getClients, getCollaborationRequests, updateCollaborationRequest, sendCollaborationRequest, discoverBusinesses } from '../../../../../services/teamService';
import { useApp } from '../../../../../context/AppContext';
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
  const { user } = useApp();
  const [clients, setClients] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [searchVal, setSearchVal] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  const [availableBusinesses, setAvailableBusinesses] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sentRequests, setSentRequests] = useState({});

  const fetchClientData = useCallback(() => {
    getClients().then(data => {
      if (data) {
        setClients(data.map(c => ({
          id: c.id,
          name: c.name,
          industry: c.organization || 'Digital Marketing',
          profileImage: c.avatar_url || '',
          status: 'active',
          connectedPlatforms: ['facebook', 'instagram', 'linkedin', 'x', 'youtube'],
          activeCampaigns: 0,
          scheduledPosts: 0,
          publishedPosts: 0,
          engagementRate: 0.0,
          lastActivity: 'Active',
        })));
      }
    });

    discoverBusinesses().then(data => {
      if (data) {
        setAvailableBusinesses(data);
      }
    }).catch(err => console.error("Failed to load discoverable businesses:", err));

    getCollaborationRequests().then(data => {
      if (data) {
        // filter incoming pending requests
        const pendingIncoming = data.filter(r => r.status === 'pending' && r.requestedByUserId !== user?.id);
        setPendingRequests(pendingIncoming.map(r => ({
          id: r.id,
          name: r.businessName || 'Business User',
          industry: 'Unknown',
          requestType: 'Management',
          timeRequested: new Date(r.createdAt || r.created_at).toLocaleDateString(),
          profileImage: '',
        })));

        // map outgoing pending requests
        const sentMap = {};
        data.filter(r => r.status === 'pending' && r.requestedByUserId === user?.id).forEach(r => {
          sentMap[r.businessUserId] = true;
        });
        setSentRequests(sentMap);
      }
    });
  }, [user]);

  const handleSendRequest = async (businessUserId) => {
    try {
      await sendCollaborationRequest({
        business_user_id: businessUserId,
        message: "Marketing Team would like to collaborate with you."
      });
      setSentRequests(prev => ({ ...prev, [businessUserId]: true }));
      alert("Collaboration invitation sent successfully!");
      fetchClientData();
    } catch (err) {
      console.error("Failed to send collaboration request:", err);
      alert(err.response?.data?.detail || "Failed to send request.");
    }
  };

  useEffect(() => {
    fetchClientData();
  }, [fetchClientData]);

  // Interactive Requests handling
  const handleAcceptRequest = async (request) => {
    try {
      await updateCollaborationRequest(request.id, { status: 'accepted' });
      fetchClientData();
    } catch (err) {
      console.error('Failed to accept request:', err);
    }
  };

  const handleDeclineRequest = async (requestId) => {
    try {
      await updateCollaborationRequest(requestId, { status: 'declined' });
      fetchClientData();
    } catch (err) {
      console.error('Failed to decline request:', err);
    }
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

  const filteredBusinesses = availableBusinesses.filter(biz => {
    return biz.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           biz.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
           (biz.organization && biz.organization.toLowerCase().includes(searchQuery.toLowerCase()));
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

      {/* Discover Businesses Section */}
      <div className="mc-section" style={{ marginTop: '40px' }}>
        <SectionTitle
          title="Discover Businesses"
          description="Find registered Business Users to invite for management collaboration"
        />
        
        <div className="mc-toolbar">
          <div className="mc-toolbar__search">
            <MdSearch className="mc-toolbar__search-icon" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mc-toolbar__search-input"
            />
          </div>
        </div>

        {filteredBusinesses.length === 0 ? (
          <div className="mc-empty-state">
            <MdPeople size={48} className="mc-empty-state__icon" />
            <h3>No new businesses found</h3>
            <p>All registered business users are already collaborating or there are no matches.</p>
          </div>
        ) : (
          <div className="mc-discover-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', marginTop: '20px' }}>
            {filteredBusinesses.map((biz) => {
              const hasSent = sentRequests[biz.id];
              return (
                <div key={biz.id} className="mc-client-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '160px' }}>
                  <div className="mc-client-card__header">
                    <Avatar
                      profileImage=""
                      firstName={biz.name}
                      lastName=""
                      size="md"
                    />
                    <div className="mc-client-card__title">
                      <h4 className="mc-client-card__name">{biz.name}</h4>
                      <span className="mc-client-card__industry">{biz.organization || 'Digital Brand'}</span>
                    </div>
                  </div>
                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => handleSendRequest(biz.id)}
                      disabled={hasSent}
                      className="mc-client-card__btn"
                      style={hasSent ? { background: '#6b7280', cursor: 'not-allowed', opacity: 0.7 } : {}}
                    >
                      {hasSent ? 'Request Pending' : 'Request Collaboration'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
