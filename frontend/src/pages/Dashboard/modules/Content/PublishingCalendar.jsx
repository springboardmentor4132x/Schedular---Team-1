/**
 * PublishingCalendar.jsx
 *
 * Professional Publishing Calendar module.
 * Renders a full monthly calendar grid on desktop, and a clean scrollable agenda
 * view on mobile screens. Filterable by platform, status, and campaign.
 */

import { useState, useMemo, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { MdChevronLeft, MdChevronRight, MdToday, MdCalendarMonth } from 'react-icons/md';
import PageContainer from '../../components/PageContainer/PageContainer';
import SectionTitle from '../../components/SectionTitle/SectionTitle';
import EmptyState from '../../components/EmptyState/EmptyState';
import { campaignRepository } from '../Campaigns/campaignRepository';
import { contentRepository } from './contentRepository';
import * as teamService from '../../../../services/teamService';
import PostDetailsModal from './PostDetailsModal';
import './PublishingCalendar.css';

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

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function PublishingCalendar({
  clientId: propClientId,
  ownerId,
  ownerType = 'marketing',
  clientName,
}) {
  const { clientId: paramClientId } = useParams();
  const clientId = propClientId || paramClientId;

  // Calendar dates
  const [currentDate, setCurrentDate] = useState(() => new Date(2026, 6, 1)); // Default July 2026 for mock consistency
  const [listRevision, setListRevision] = useState(0);

  // Filters
  const [filterPlatform, setFilterPlatform] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterCampaign, setFilterCampaign] = useState('All');
  const [filterClientId, setFilterClientId] = useState('All');

  // Details Modal
  const [viewingPostId, setViewingPostId] = useState(null);

  const [campaignsList, setCampaignsList] = useState([]);
  const [rawPosts, setRawPosts] = useState([]);
  const [clients, setClients] = useState([]);

  // Fetch campaigns, clients, and posts
  useEffect(() => {
    campaignRepository.getCampaigns()
      .then(setCampaignsList)
      .catch((err) => console.error('Failed to load campaigns:', err));

    teamService.getClients()
      .then(setClients)
      .catch((err) => console.error('Failed to load clients:', err));
  }, [listRevision]);

  const campaigns = useMemo(() => {
    if (ownerType === 'marketing') {
      const activeClientId = clientId || (filterClientId !== 'All' ? filterClientId : null);
      if (activeClientId) {
        return campaignsList.filter((c) => String(c.clientId) === String(activeClientId) || String(c.client_id) === String(activeClientId));
      }
      return campaignsList;
    }
    return campaignsList.filter((c) => c.ownerId === ownerId || c.owner_id === ownerId);
  }, [campaignsList, clientId, filterClientId, ownerId, ownerType]);

  // Load all posts
  useEffect(() => {
    let filter = {};
    if (ownerType === 'marketing') {
      if (clientId) {
        filter = { clientId };
      } else if (filterClientId !== 'All') {
        filter = { clientId: filterClientId };
      }
    } else {
      filter = { ownerType, ownerId };
    }
    contentRepository.getPosts(filter)
      .then(setRawPosts)
      .catch((err) => console.error('Failed to load posts:', err));
  }, [clientId, filterClientId, ownerId, ownerType, listRevision]);

  // Apply filters client-side
  const filteredPosts = useMemo(() => {
    return rawPosts.filter((post) => {
      // Must have scheduled/published date to render on calendar
      if (!post.scheduledAt) return false;

      if (filterPlatform !== 'All' && !post.platforms.includes(filterPlatform)) return false;
      if (filterStatus !== 'All' && post.status !== filterStatus.toLowerCase()) return false;
      if (filterCampaign !== 'All' && post.campaignId !== filterCampaign) return false;

      return true;
    });
  }, [rawPosts, filterPlatform, filterStatus, filterCampaign]);

  const viewingPost = useMemo(() => rawPosts.find((p) => p.id === viewingPostId), [rawPosts, viewingPostId]);

  // Month stats calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  const monthLabel = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  // Grid dates cells
  const dayCells = useMemo(() => {
    const cells = [];
    // padding cells
    for (let i = 0; i < firstDayIndex; i++) {
      cells.push({ day: null, dateKey: null });
    }
    // actual month days
    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({ day: d, dateKey: dateStr });
    }
    return cells;
  }, [year, month, firstDayIndex, totalDays]);

  // Map filtered posts to calendar days
  const calendarPostsMap = useMemo(() => {
    const map = {};
    filteredPosts.forEach((post) => {
      const dt = new Date(post.scheduledAt);
      const dateKey = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(post);
    });
    return map;
  }, [filteredPosts]);

  // Navigation handlers
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date(2026, 6, 1)); // reset to July 2026 (for mock coherence)
  };

  // Agenda days for mobile list view
  const agendaDays = useMemo(() => {
    const items = [];
    for (let d = 1; d <= totalDays; d++) {
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const postsForDay = calendarPostsMap[dateKey] || [];
      if (postsForDay.length > 0) {
        items.push({
          day: d,
          dateLabel: new Date(year, month, d).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }),
          posts: postsForDay,
        });
      }
    }
    return items;
  }, [year, month, totalDays, calendarPostsMap]);

  return (
    <PageContainer
      title="Publishing Calendar"
      description={
        clientName
          ? `Interactive content scheduler calendar workspace for ${clientName}.`
          : 'Interactive calendar display workspace for all your publication pipelines.'
      }
      breadcrumb={clientName ? ['Marketing', clientName, 'Calendar'] : ['Creator', 'Calendar']}
    >
      {/* Filters Toolbar */}
      <div className="pc-toolbar">
        <div className="pc-toolbar__left">
          <SectionTitle
            title="Editorial Calendar"
            description="Preview and filter your content publishing schedule."
          />
        </div>

        <div className="pc-toolbar__filters">
          {/* Client Filter */}
          {!clientId && ownerType === 'marketing' && (
            <select
              className="pc-toolbar__select"
              value={filterClientId}
              onChange={(e) => {
                setFilterClientId(e.target.value);
                setFilterCampaign('All'); // Reset campaign selection when client changes
              }}
            >
              {clients.length === 0 ? (
                <option value="">No clients available</option>
              ) : (
                <>
                  <option value="All">All Clients</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.organization || c.name}</option>
                  ))}
                </>
              )}
            </select>
          )}

          {/* Platforms Filter */}
          <select
            className="pc-toolbar__select"
            value={filterPlatform}
            onChange={(e) => setFilterPlatform(e.target.value)}
          >
            <option value="All">All Platforms</option>
            {Object.keys(PLATFORM_CHARS).map((p) => (
              <option key={p} value={p}>{p.toUpperCase()}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            className="pc-toolbar__select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Publishing">Publishing</option>
            <option value="Published">Published</option>
            <option value="Failed">Failed</option>
          </select>

          {/* Campaigns Filter */}
          <select
            className="pc-toolbar__select"
            value={filterCampaign}
            onChange={(e) => setFilterCampaign(e.target.value)}
          >
            <option value="All">All Campaigns</option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Calendar Controls */}
      <div className="pc-controls">
        <h3 className="pc-controls__title">{monthLabel}</h3>
        <div className="pc-controls__nav">
          <button className="pc-nav-btn" onClick={handlePrevMonth} title="Previous Month">
            <MdChevronLeft />
          </button>
          <button className="pc-nav-btn pc-nav-btn--today" onClick={handleToday}>
            <MdToday style={{ marginRight: '4px' }} /> July 2026
          </button>
          <button className="pc-nav-btn" onClick={handleNextMonth} title="Next Month">
            <MdChevronRight />
          </button>
        </div>
      </div>

      {/* Desktop Calendar Grid */}
      <div className="pc-grid-wrap">
        <div className="pc-grid-header">
          {WEEKDAYS.map((day) => (
            <div key={day} className="pc-grid-header__cell">{day}</div>
          ))}
        </div>
        
        <div className="pc-grid-body">
          {dayCells.map((cell, idx) => {
            const datePosts = cell.dateKey ? (calendarPostsMap[cell.dateKey] || []) : [];
            return (
              <div
                key={idx}
                className={`pc-grid-cell${!cell.day ? ' pc-grid-cell--empty' : ''}`}
              >
                {cell.day && <span className="pc-grid-cell__number">{cell.day}</span>}
                
                <div className="pc-grid-cell__posts-list">
                  {datePosts.slice(0, 3).map((post) => (
                    <div
                      key={post.id}
                      onClick={() => setViewingPostId(post.id)}
                      className={`pc-mini-post pc-mini-post--${post.status}`}
                      title={post.caption}
                    >
                      <span
                        className="pc-mini-post__platform"
                        style={{ background: PLATFORM_COLORS[post.platforms[0]] }}
                      >
                        {PLATFORM_CHARS[post.platforms[0]]}
                      </span>
                      <span className="pc-mini-post__text">
                        {post.caption || 'No Caption'}
                      </span>
                    </div>
                  ))}
                  {datePosts.length > 3 && (
                    <span className="pc-grid-cell__more">
                      + {datePosts.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile Agenda List View */}
      <div className="pc-agenda-wrap">
        <h4 className="pc-agenda-title">Agenda list for {monthLabel}</h4>
        
        {agendaDays.length === 0 ? (
          <div className="pc-empty-month">
            <EmptyState
              illustration={<MdCalendarMonth />}
              title="No publications scheduled"
              description="No scheduled posts found matching selected filters for this month."
            />
          </div>
        ) : (
          <div className="pc-agenda-list">
            {agendaDays.map((day) => (
              <div key={day.day} className="pc-agenda-day">
                <div className="pc-agenda-day__header">{day.dateLabel}</div>
                <div className="pc-agenda-day__posts">
                  {day.posts.map((post) => (
                    <div
                      key={post.id}
                      onClick={() => setViewingPostId(post.id)}
                      className="pc-agenda-post-row"
                    >
                      <span className="pc-agenda-post-row__time">
                        {new Date(post.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span
                        className="pc-agenda-post-row__platform"
                        style={{ background: PLATFORM_COLORS[post.platforms[0]] }}
                      >
                        {PLATFORM_CHARS[post.platforms[0]]}
                      </span>
                      <p className="pc-agenda-post-row__caption">{post.caption || 'No Caption'}</p>
                      <span className={`pc-agenda-post-row__status cs-status-badge--${post.status}`}>
                        {post.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Details View Modal */}
      {viewingPostId && viewingPost && (
        <PostDetailsModal
          post={viewingPost}
          onClose={() => setViewingPostId(null)}
          onEdit={() => {
            setViewingPostId(null);
            alert('Reopen Content Scheduling list tab to edit scheduled post values.');
          }}
          onDelete={async (id) => {
            const confirm = window.confirm('Are you sure you want to delete this scheduled post?');
            if (confirm) {
              try {
                await contentRepository.deletePost(id);
                setListRevision((prev) => prev + 1);
                setViewingPostId(null);
              } catch {
                alert('Failed to delete post.');
              }
            }
          }}
          onCancelSchedule={async (id) => {
            const confirm = window.confirm('Are you sure you want to cancel publishing schedule?');
            if (confirm) {
              try {
                await contentRepository.updatePost(id, { status: 'draft', scheduledAt: null });
                setListRevision((prev) => prev + 1);
                setViewingPostId(null);
              } catch {
                alert('Failed to cancel schedule.');
              }
            }
          }}
          readOnly={false}
        />
      )}
    </PageContainer>
  );
}
