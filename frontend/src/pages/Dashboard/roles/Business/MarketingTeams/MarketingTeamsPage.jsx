/**
 * MarketingTeamsPage.jsx
 *
 * Business User view to discover and request collaboration from Marketing Teams.
 * Also shows currently assigned marketing team.
 */

import { useState, useEffect } from 'react';
import { MdSearch, MdPeople, MdStar, MdCheckCircle, MdOutlineHourglassEmpty } from 'react-icons/md';
import Avatar from '../../../components/Avatar/Avatar';
import PageContainer from '../../../components/PageContainer/PageContainer';
import SectionTitle from '../../../components/SectionTitle/SectionTitle';
import { discoverMarketingTeams, sendCollaborationRequest } from '../../../../../services/teamService';
import './MarketingTeamsPage.css';

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

export default function MarketingTeamsPage() {
  const [myTeam, setMyTeam] = useState(null);
  const [availableTeams, setAvailableTeams] = useState([]);

  useEffect(() => {
    discoverMarketingTeams().then(data => {
      setAvailableTeams(data.map(team => ({
        id: team.id,
        name: team.name,
        profileImage: '',
        rating: 5.0,
        experience: '2+ years',
        description: 'Marketing agency',
        specialties: ['Social Media Management'],
        supportedPlatforms: ['facebook', 'instagram', 'linkedin', 'x'],
        activeClientCount: 1,
        availabilityStatus: 'accepting_requests'
      })));
    }).catch(() => setAvailableTeams([]));
  }, []);
  const [searchVal, setSearchVal] = useState('');
  const [filterExpertise, setFilterExpertise] = useState('All');
  const [filterPlatform, setFilterPlatform] = useState('All');
  const [filterAvailability, setFilterAvailability] = useState('All');
  const [sortBy, setSortBy] = useState('recommended');

  // Request State
  const [requestedTeamId, setRequestedTeamId] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [modalTeamName, setModalTeamName] = useState('');
  const [sentRequests, setSentRequests] = useState({}); // { teamId: true }

  const handleOpenRequest = (teamId, teamName) => {
    setRequestedTeamId(teamId);
    setModalTeamName(teamName);
    setShowConfirmModal(true);
  };

  const handleConfirmRequest = async () => {
    try {
      await sendCollaborationRequest({ teamId: requestedTeamId, message: "Let's collaborate" });
      setSentRequests(prev => ({ ...prev, [requestedTeamId]: true }));
    } catch (err) {
      console.error(err);
    }
    setShowConfirmModal(false);
    setRequestedTeamId(null);
  };

  const filteredTeams = availableTeams.filter(team => {
    const matchesSearch = team.name.toLowerCase().includes(searchVal.toLowerCase()) || 
                          team.description.toLowerCase().includes(searchVal.toLowerCase());
    
    const matchesExpertise = filterExpertise === 'All' || team.specialties.includes(filterExpertise);
    const matchesPlatform = filterPlatform === 'All' || team.supportedPlatforms.includes(filterPlatform);
    
    const matchesAvailability = filterAvailability === 'All' || 
                                (filterAvailability === 'Available' && team.availabilityStatus === 'accepting_requests') ||
                                (filterAvailability === 'Full' && team.availabilityStatus === 'full');
                                
    return matchesSearch && matchesExpertise && matchesPlatform && matchesAvailability;
  });

  const sortedTeams = [...filteredTeams].sort((a, b) => {
    if (sortBy === 'rating') return b.rating - a.rating;
    if (sortBy === 'experience') return b.experience.localeCompare(a.experience);
    return 0; // Default recommended
  });

  return (
    <PageContainer
      title="Marketing Teams"
      description="Find and collaborate with a marketing team to manage your social presence."
      breadcrumb={['Business', 'Marketing Teams']}
    >
      {/* My Marketing Team Banner */}
      {myTeam && (
        <div className="bt-section">
          <SectionTitle
            title="My Marketing Team"
            description="Your active marketing manager relationship"
          />
          <div className="bt-my-team-card">
            <div className="bt-my-team-card__main">
              <Avatar
                profileImage={myTeam.profileImage}
                firstName={myTeam.name}
                lastName=""
                size="lg"
              />
              <div className="bt-my-team-card__info">
                <div className="bt-my-team-card__title-row">
                  <h3 className="bt-my-team-card__name">{myTeam.name}</h3>
                  <span className="bt-my-team-card__badge-status">
                    <MdCheckCircle /> {myTeam.status}
                  </span>
                </div>
                <p className="bt-my-team-card__meta">
                  Experience: <strong>{myTeam.experience}</strong> • Rating: <strong>★ {myTeam.rating}</strong>
                </p>
                <div className="bt-my-team-card__specialties">
                  {myTeam.specialties.map(spec => (
                    <span key={spec} className="bt-my-team-card__spec">{spec}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Performance status */}
            <div className="bt-my-team-card__stats">
              <div className="bt-my-team-stat">
                <span className="bt-my-team-stat__val">{myTeam.activeCampaigns}</span>
                <span className="bt-my-team-stat__lbl">Active Campaigns</span>
              </div>
              <div className="bt-my-team-stat">
                <span className="bt-my-team-stat__val">{myTeam.scheduledPosts}</span>
                <span className="bt-my-team-stat__lbl">Scheduled Posts</span>
              </div>
              <div className="bt-my-team-stat">
                <span className="bt-my-team-stat__val text-truncate" style={{ maxWidth: '140px' }} title={myTeam.lastActivity}>
                  {myTeam.lastActivity.split(' ').slice(-2).join(' ')}
                </span>
                <span className="bt-my-team-stat__lbl">Last Activity</span>
              </div>
              <button className="bt-my-team-card__action-btn">
                View Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Discovery Marketplace Section */}
      <div className="bt-section">
        <SectionTitle
          title="Discover Marketing Teams"
          description="Browse and request partnerships with professional agencies"
        />

        {/* Filter Toolbar */}
        <div className="bt-toolbar">
          <div className="bt-toolbar__search">
            <MdSearch className="bt-toolbar__search-icon" />
            <input
              type="text"
              placeholder="Search marketing teams..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              className="bt-toolbar__search-input"
            />
          </div>

          <div className="bt-toolbar__filters">
            <div className="bt-filter-group">
              <label className="bt-filter-label">Expertise</label>
              <select
                value={filterExpertise}
                onChange={(e) => setFilterExpertise(e.target.value)}
                className="bt-filter-select"
              >
                <option value="All">All Specialities</option>
                <option value="Social Media Management">Social Media Management</option>
                <option value="Campaign Strategy">Campaign Strategy</option>
                <option value="Content Marketing">Content Marketing</option>
                <option value="Brand Growth">Brand Growth</option>
                <option value="Analytics">Analytics</option>
              </select>
            </div>

            <div className="bt-filter-group">
              <label className="bt-filter-label">Platform</label>
              <select
                value={filterPlatform}
                onChange={(e) => setFilterPlatform(e.target.value)}
                className="bt-filter-select"
              >
                <option value="All">All Platforms</option>
                <option value="instagram">Instagram</option>
                <option value="facebook">Facebook</option>
                <option value="youtube">YouTube</option>
                <option value="linkedin">LinkedIn</option>
                <option value="x">X (Twitter)</option>
              </select>
            </div>

            <div className="bt-filter-group">
              <label className="bt-filter-label">Availability</label>
              <select
                value={filterAvailability}
                onChange={(e) => setFilterAvailability(e.target.value)}
                className="bt-filter-select"
              >
                <option value="All">All Statuses</option>
                <option value="Available">Accepting Requests</option>
                <option value="Full">Full</option>
              </select>
            </div>

            <div className="bt-filter-group">
              <label className="bt-filter-label">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bt-filter-select"
              >
                <option value="recommended">Recommended</option>
                <option value="rating">Top Rated</option>
                <option value="experience">Most Experienced</option>
              </select>
            </div>
          </div>
        </div>

        {/* Discovery Grid */}
        {sortedTeams.length === 0 ? (
          <div className="bt-empty-state">
            <MdPeople size={48} className="bt-empty-state__icon" />
            <h3>No marketing teams found</h3>
            <p>Try resetting or clearing your search filters to find available agencies.</p>
          </div>
        ) : (
          <div className="bt-teams-grid">
            {sortedTeams.map((team) => {
              const hasRequested = sentRequests[team.id];
              return (
                <div key={team.id} className="bt-team-card">
                  <div className="bt-team-card__header">
                    <Avatar
                      profileImage={team.profileImage}
                      firstName={team.name}
                      lastName=""
                      size="md"
                    />
                    <div className="bt-team-card__title">
                      <h4 className="bt-team-card__name">{team.name}</h4>
                      <div className="bt-team-card__rating">
                        <MdStar className="bt-team-card__star-icon" />
                        <span>{team.rating} ({team.experience})</span>
                      </div>
                    </div>
                  </div>

                  <p className="bt-team-card__desc">{team.description}</p>

                  <div className="bt-team-card__chips">
                    {team.specialties.map(spec => (
                      <span key={spec} className="bt-team-card__spec-chip">{spec}</span>
                    ))}
                  </div>

                  <div className="bt-team-card__platforms">
                    {team.supportedPlatforms.map(p => (
                      <span
                        key={p}
                        className="bt-team-card__platform"
                        style={{ background: PLATFORM_COLORS[p] }}
                        title={p}
                      >
                        {PLATFORM_CHARS[p]}
                      </span>
                    ))}
                  </div>

                  <div className="bt-team-card__footer">
                    <span className="bt-team-card__client-count">
                      Clients managed: <strong>{team.activeClientCount}</strong>
                    </span>

                    {hasRequested ? (
                      <button className="bt-team-card__btn bt-team-card__btn--requested" disabled>
                        <MdOutlineHourglassEmpty /> Request Sent
                      </button>
                    ) : team.availabilityStatus === 'full' ? (
                      <button className="bt-team-card__btn bt-team-card__btn--full" disabled>
                        Team Full
                      </button>
                    ) : (
                      <button
                        onClick={() => handleOpenRequest(team.id, team.name)}
                        className="bt-team-card__btn bt-team-card__btn--primary"
                      >
                        Request Collaboration
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="bt-modal-overlay">
          <div className="bt-modal">
            <h3 className="bt-modal__title">Confirm Collaboration Request</h3>
            <p className="bt-modal__text">
              Would you like to send a partnership request to <strong>{modalTeamName}</strong>?
              If accepted, they will be able to manage and schedule posts for your connected social accounts.
            </p>
            <div className="bt-modal__actions">
              <button
                className="bt-modal__btn bt-modal__btn--cancel"
                onClick={() => setShowConfirmModal(false)}
              >
                Cancel
              </button>
              <button
                className="bt-modal__btn bt-modal__btn--confirm"
                onClick={handleConfirmRequest}
              >
                Confirm Request
              </button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
