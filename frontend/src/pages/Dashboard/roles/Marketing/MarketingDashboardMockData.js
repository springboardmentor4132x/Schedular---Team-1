/**
 * MarketingDashboardMockData.js
 *
 * All mock data for the Marketing Team Dashboard — 10 sections.
 * Replace individual keys with real API calls as the backend grows.
 */

const now = Date.now();
const daysAgo  = (n) => new Date(now - n * 86400000).toISOString();
const hoursAgo = (n) => new Date(now - n * 3600000).toISOString();
const hoursAhead = (n) => new Date(now + n * 3600000).toISOString();

// ── Section 2: KPI Stats ──────────────────────────────────────────────────────
export const MOCK_MKT_STATS = [
  { id: 'clients',   title: 'Assigned Clients',  value: '4',   change: null, trend: 'neutral' },
  { id: 'campaigns', title: 'Running Campaigns', value: '9',   change: 2,    trend: 'up'      },
  { id: 'drafts',    title: 'Draft Posts',        value: '14',  change: -3,   trend: 'down'    },
  { id: 'scheduled', title: 'Scheduled Posts',    value: '27',  change: 8,    trend: 'up'      },
  { id: 'queue',     title: "Today's Queue",       value: '12',  change: null, trend: 'neutral' },
  { id: 'reviews',   title: 'Pending Reviews',    value: '5',   change: null, trend: 'neutral' },
];

// ── Section 3: Clients ────────────────────────────────────────────────────────
export const MOCK_CLIENTS = [
  {
    id: 1,
    name: 'Nike',
    tagline: 'Just Do It',
    industry: 'Sportswear',
    logoEmoji: '👟',
    logoColor: '#111827',
    campaigns: 3,
    platforms: ['instagram', 'facebook', 'youtube'],
    status: 'active',
    health: 94,
    profileImage: null,
  },
  {
    id: 2,
    name: 'Puma',
    tagline: 'Forever Faster',
    industry: 'Sportswear',
    logoEmoji: '🐆',
    logoColor: '#C8102E',
    campaigns: 2,
    platforms: ['instagram', 'x'],
    status: 'active',
    health: 81,
    profileImage: null,
  },
  {
    id: 3,
    name: 'Tesla',
    tagline: 'Accelerating Sustainability',
    industry: 'Automotive',
    logoEmoji: '⚡',
    logoColor: '#CC0000',
    campaigns: 2,
    platforms: ['linkedin', 'x', 'youtube'],
    status: 'active',
    health: 89,
    profileImage: null,
  },
  {
    id: 4,
    name: 'Adidas',
    tagline: 'Impossible is Nothing',
    industry: 'Sportswear',
    logoEmoji: '🏃',
    logoColor: '#000000',
    campaigns: 2,
    platforms: ['instagram', 'facebook'],
    status: 'review',
    health: 72,
    profileImage: null,
  },
];

// ── Section 4: Today's Schedule (timeline) ────────────────────────────────────
export const MOCK_TODAY_SCHEDULE = [
  { id: 1, time: '09:00', platform: 'facebook',  client: 'Nike',   type: 'Post',      caption: 'Summer Collection launch — be the first to know 🌊', status: 'scheduled' },
  { id: 2, time: '10:30', platform: 'linkedin',  client: 'Tesla',  type: 'Article',   caption: 'The future of sustainable mobility starts today...', status: 'scheduled' },
  { id: 3, time: '11:30', platform: 'instagram', client: 'Puma',   type: 'Story',     caption: '⚡ Forever Faster — new drop incoming', status: 'scheduled' },
  { id: 4, time: '13:00', platform: 'youtube',   client: 'Nike',   type: 'Short',     caption: 'Behind the scenes: creating the perfect running shoe', status: 'queued'    },
  { id: 5, time: '14:00', platform: 'instagram', client: 'Puma',   type: 'Reel',      caption: 'Streets x Tracks collab — out now! 🎬', status: 'queued'    },
  { id: 6, time: '16:00', platform: 'facebook',  client: 'Adidas', type: 'Post',      caption: 'Impossible is Nothing — new campaign drops Friday', status: 'draft'     },
  { id: 7, time: '18:00', platform: 'x',         client: 'Tesla',  type: 'Tweet',     caption: 'Charging into the weekend. ⚡🚀 #Tesla #EV', status: 'scheduled' },
];

// ── Section 5: Running Campaigns ─────────────────────────────────────────────
export const MOCK_MKT_CAMPAIGNS = [
  {
    id: 1,
    name: 'Summer Collection Launch',
    client: 'Nike',
    clientColor: '#111827',
    progress: 68,
    platforms: ['instagram', 'facebook', 'youtube'],
    deadline: daysAgo(-12),
    status: 'active',
    postsLeft: 8,
  },
  {
    id: 2,
    name: 'Forever Faster — Streets',
    client: 'Puma',
    clientColor: '#C8102E',
    progress: 42,
    platforms: ['instagram', 'x'],
    deadline: daysAgo(-20),
    status: 'active',
    postsLeft: 14,
  },
  {
    id: 3,
    name: 'Q3 Sustainability Push',
    client: 'Tesla',
    clientColor: '#CC0000',
    progress: 85,
    platforms: ['linkedin', 'youtube'],
    deadline: daysAgo(-5),
    status: 'active',
    postsLeft: 3,
  },
  {
    id: 4,
    name: 'Impossible is Nothing',
    client: 'Adidas',
    clientColor: '#000000',
    progress: 22,
    platforms: ['instagram', 'facebook'],
    deadline: daysAgo(-30),
    status: 'review',
    postsLeft: 22,
  },
  {
    id: 5,
    name: 'Back to School 2025',
    client: 'Nike',
    clientColor: '#111827',
    progress: 10,
    platforms: ['instagram', 'youtube'],
    deadline: daysAgo(-45),
    status: 'planning',
    postsLeft: 40,
  },
];

// ── Section 6: Draft Content ──────────────────────────────────────────────────
export const MOCK_DRAFTS = [
  {
    id: 1,
    client: 'Nike',
    clientColor: '#111827',
    platform: 'instagram',
    caption: 'Run like the world depends on it 🌍 New campaign drop this Friday — stay tuned.',
    lastEdited: hoursAgo(2),
    thumbnail: null,
    platforms: ['instagram', 'facebook'],
  },
  {
    id: 2,
    client: 'Tesla',
    clientColor: '#CC0000',
    platform: 'linkedin',
    caption: 'Charging infrastructure is growing faster than ever. Here is what it means for businesses in 2025...',
    lastEdited: hoursAgo(5),
    thumbnail: null,
    platforms: ['linkedin'],
  },
  {
    id: 3,
    client: 'Puma',
    clientColor: '#C8102E',
    platform: 'instagram',
    caption: 'The streets are calling. 📢 New collab with top athletes dropping next week.',
    lastEdited: hoursAgo(12),
    thumbnail: null,
    platforms: ['instagram', 'x'],
  },
  {
    id: 4,
    client: 'Adidas',
    clientColor: '#000000',
    platform: 'facebook',
    caption: 'Impossible is Nothing — and this campaign proves it. Coming Friday.',
    lastEdited: daysAgo(1),
    thumbnail: null,
    platforms: ['facebook', 'instagram'],
  },
];

// ── Section 7: Publishing Queue ───────────────────────────────────────────────
export const MOCK_QUEUE = [
  { id: 1, platform: 'facebook',  client: 'Nike',   scheduledAt: hoursAhead(0.5), priority: 'high',   caption: 'Summer Collection launch' },
  { id: 2, platform: 'linkedin',  client: 'Tesla',  scheduledAt: hoursAhead(2),   priority: 'high',   caption: 'Q3 Sustainability milestone' },
  { id: 3, platform: 'instagram', client: 'Puma',   scheduledAt: hoursAhead(3),   priority: 'medium', caption: 'Forever Faster story drop' },
  { id: 4, platform: 'youtube',   client: 'Nike',   scheduledAt: hoursAhead(5),   priority: 'medium', caption: 'Behind the scenes short' },
  { id: 5, platform: 'x',         client: 'Tesla',  scheduledAt: hoursAhead(9),   priority: 'low',    caption: 'Weekend EV motivation post' },
  { id: 6, platform: 'facebook',  client: 'Adidas', scheduledAt: hoursAhead(12),  priority: 'low',    caption: 'Impossible is Nothing teaser' },
];

// ── Section 8: Notifications ──────────────────────────────────────────────────
export const MOCK_MKT_NOTIFICATIONS = [
  { id: 1, type: 'approval',  icon: '✅', title: 'Nike post approved',                body: 'Client approved the Summer Collection reel. Ready to schedule.',              time: hoursAgo(0.5), isRead: false },
  { id: 2, type: 'alert',     icon: '⚠️', title: 'Tesla campaign deadline in 5 days', body: 'Q3 Sustainability Push is at 85% with 3 posts remaining.',                    time: hoursAgo(1),   isRead: false },
  { id: 3, type: 'message',   icon: '💬', title: 'New message from Adidas team',       body: 'Can we shift the Friday post to Saturday? The TV ad drops Friday.',          time: hoursAgo(2),   isRead: false },
  { id: 4, type: 'update',    icon: '📊', title: 'Weekly report ready',                body: 'Your team\'s performance report for this week is ready to download.',         time: hoursAgo(4),   isRead: true  },
  { id: 5, type: 'system',    icon: '🔔', title: 'LinkedIn token refreshed',           body: 'Tesla\'s LinkedIn access token was automatically refreshed.',                  time: hoursAgo(6),   isRead: true  },
  { id: 6, type: 'approval',  icon: '⏳', title: 'Puma reel awaiting approval',        body: 'The Forever Faster reel has been sent to the client for approval.',           time: hoursAgo(8),   isRead: true  },
];

// ── Section 9: Performance Charts ────────────────────────────────────────────
export const MOCK_WEEKLY_POSTS = [
  { label: 'Mon', value: 4 },
  { label: 'Tue', value: 7 },
  { label: 'Wed', value: 5 },
  { label: 'Thu', value: 9 },
  { label: 'Fri', value: 6 },
  { label: 'Sat', value: 3 },
  { label: 'Sun', value: 2 },
];

export const MOCK_MKT_PLATFORM_DIST = [
  { label: 'Instagram', value: 36, color: '#E1306C' },
  { label: 'Facebook',  value: 24, color: '#1877F2' },
  { label: 'LinkedIn',  value: 18, color: '#0A66C2' },
  { label: 'YouTube',   value: 14, color: '#FF0000' },
  { label: 'X',         value: 8,  color: '#111827' },
];

export const MOCK_CAMPAIGN_SUCCESS = [
  { label: 'Nike S.', value: 94 },
  { label: 'Tesla Q3', value: 85 },
  { label: 'Puma FF',  value: 72 },
  { label: 'Adidas IN', value: 58 },
];

export const MOCK_MKT_ENGAGEMENT = [
  { label: 'Mon', value: 3800 },
  { label: 'Tue', value: 6200 },
  { label: 'Wed', value: 5100 },
  { label: 'Thu', value: 8400 },
  { label: 'Fri', value: 7200 },
  { label: 'Sat', value: 4100 },
  { label: 'Sun', value: 2900 },
];
