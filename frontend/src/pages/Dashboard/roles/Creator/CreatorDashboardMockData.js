/**
 * CreatorDashboardMockData.js
 *
 * Centralized mock data for Content Creator Dashboard.
 */

const now = Date.now();
const daysAgo = (n) => new Date(now - n * 86400000).toISOString();
const hoursAgo = (n) => new Date(now - n * 3600000).toISOString();
const hoursAhead = (n) => new Date(now + n * 3600000).toISOString();
const daysAhead = (n) => new Date(now + n * 86400000).toISOString();

// ── Section 2: KPI Overview ──────────────────────────────────────────────────
export const MOCK_CREATOR_STATS = [
  { id: 'total',     title: 'Total Posts',       value: '148', change: 12,  trend: 'up'      },
  { id: 'drafts',    title: 'Drafts',            value: '8',   change: -2,  trend: 'down'    },
  { id: 'scheduled', title: 'Scheduled Posts',    value: '18',  change: 4,   trend: 'up'      },
  { id: 'published', title: 'Published Posts',    value: '122', change: 15,  trend: 'up'      },
  { id: 'campaigns', title: 'Active Campaigns',   value: '3',   change: null, trend: 'neutral' },
  { id: 'reviews',   title: 'Pending Reviews',    value: '2',   change: null, trend: 'neutral' },
];

// ── Section 3: Today's Content ──────────────────────────────────────────────
export const MOCK_TODAY_CONTENT = [
  {
    id: 1,
    time: '10:00 AM',
    platform: 'instagram',
    type: 'Reel',
    caption: 'Baahubali 3 first look tease! Re-entering the kingdom of Mahishmati ⚔️👑',
    campaign: 'Baahubali 3 Promotion',
    status: 'scheduled',
  },
  {
    id: 2,
    time: '02:30 PM',
    platform: 'youtube',
    type: 'Short',
    caption: 'Behind the scenes of Salaar stunts. Stunt coordinator walkthrough 🎬🔥',
    campaign: 'Salaar Promotion',
    status: 'ready',
  },
  {
    id: 3,
    time: '05:00 PM',
    platform: 'x',
    type: 'Tweet',
    caption: 'Salaar teaser launch date announcement incoming at 6 PM! Stay tuned. #Salaar #Prabhas',
    campaign: 'Salaar Promotion',
    status: 'review',
  },
];

// ── Section 4: My Content / Recent Posts ──────────────────────────────────────
export const MOCK_RECENT_POSTS = [
  {
    id: 101,
    caption: 'Unboxing the new premium sneaker collection collab. Comfort level is crazy! 👟🔥',
    platform: 'instagram',
    status: 'draft',
    dateTime: hoursAgo(2),
    campaign: 'Brand Collaboration',
  },
  {
    id: 102,
    caption: 'Salaar part 2 concept shoot behind the scenes. Lights, camera, action! 🎥🍿',
    platform: 'youtube',
    status: 'scheduled',
    dateTime: hoursAhead(6),
    campaign: 'Salaar Promotion',
  },
  {
    id: 103,
    caption: 'Fitness routine update: Morning workout routine for peak athletic performance.',
    platform: 'instagram',
    status: 'published',
    dateTime: daysAgo(1),
    campaign: 'Personal Content',
  },
  {
    id: 104,
    caption: 'Mahishmati kingdom map artwork reveal. A trip down memory lane 🗺️🛡️',
    platform: 'facebook',
    status: 'published',
    dateTime: daysAgo(3),
    campaign: 'Baahubali 3 Promotion',
  },
  {
    id: 105,
    caption: 'Quick Q&A session announcement: Ask me anything this Saturday!',
    platform: 'x',
    status: 'scheduled',
    dateTime: daysAhead(1),
    campaign: 'Personal Content',
  },
  {
    id: 106,
    caption: 'Collaborating with local designers for the upcoming brand collection launch.',
    platform: 'linkedin',
    status: 'draft',
    dateTime: daysAgo(2),
    campaign: 'Brand Collaboration',
  },
];

// ── Section 5: Active Campaigns ──────────────────────────────────────────────
export const MOCK_CREATOR_CAMPAIGNS = [
  {
    id: 201,
    name: 'Baahubali 3 Promotion',
    status: 'active',
    progress: 75,
    postsCount: 15,
    platforms: ['instagram', 'facebook', 'youtube'],
    deadline: daysAhead(10),
  },
  {
    id: 202,
    name: 'Salaar Promotion',
    status: 'active',
    progress: 45,
    postsCount: 12,
    platforms: ['instagram', 'x', 'youtube'],
    deadline: daysAhead(25),
  },
  {
    id: 203,
    name: 'Brand Collaboration',
    status: 'active',
    progress: 90,
    postsCount: 8,
    platforms: ['instagram', 'linkedin'],
    deadline: daysAhead(4),
  },
];

// ── Section 6: Upcoming Schedule ─────────────────────────────────────────────
export const MOCK_UPCOMING_SCHEDULE = [
  {
    id: 301,
    dayGroup: 'Today',
    time: '6:00 PM',
    platform: 'instagram',
    type: 'Reel',
    caption: 'Exclusive trailer reaction & commentary',
    campaign: 'Baahubali 3 Promotion',
    status: 'scheduled',
  },
  {
    id: 302,
    dayGroup: 'Tomorrow',
    time: '10:00 AM',
    platform: 'facebook',
    type: 'Post',
    caption: 'Promo launch visual post with sponsor product tags',
    campaign: 'Brand Collaboration',
    status: 'scheduled',
  },
  {
    id: 303,
    dayGroup: 'Friday',
    time: '7:30 PM',
    platform: 'youtube',
    type: 'Short',
    caption: 'Salaar teaser cut & theme song loop',
    campaign: 'Salaar Promotion',
    status: 'queued',
  },
];

// ── Section 7: Content Calendar Preview (7 days) ────────────────────────────────
export const MOCK_CALENDAR_PREVIEW = [
  { dayName: 'Mon', date: 'Jul 20', postsCount: 2, isToday: false },
  { dayName: 'Tue', date: 'Jul 21', postsCount: 0, isToday: false },
  { dayName: 'Wed', date: 'Jul 22', postsCount: 3, isToday: true  },
  { dayName: 'Thu', date: 'Jul 23', postsCount: 1, isToday: false },
  { dayName: 'Fri', date: 'Jul 24', postsCount: 4, isToday: false },
  { dayName: 'Sat', date: 'Jul 25', postsCount: 0, isToday: false },
  { dayName: 'Sun', date: 'Jul 26', postsCount: 2, isToday: false },
];

// ── Section 8: Performance Snapshot ──────────────────────────────────────────
export const MOCK_CREATOR_PERFORMANCE = {
  weeklyReach: '345.8K',
  reachChange: 18.5,
  avgEngagement: '6.4%',
  engChange: 2.1,
  postsPublished: 14,
  bestPlatform: 'YouTube',
  reachTrend: [
    { label: 'Mon', value: 28000 },
    { label: 'Tue', value: 34000 },
    { label: 'Wed', value: 42000 },
    { label: 'Thu', value: 39000 },
    { label: 'Fri', value: 51000 },
    { label: 'Sat', value: 48000 },
    { label: 'Sun', value: 55000 },
  ],
  engagementTrend: [
    { label: 'Mon', value: 5.2 },
    { label: 'Tue', value: 5.8 },
    { label: 'Wed', value: 6.1 },
    { label: 'Thu', value: 6.0 },
    { label: 'Fri', value: 6.7 },
    { label: 'Sat', value: 6.4 },
    { label: 'Sun', value: 7.1 },
  ],
};

// ── Section 9: Notifications / Reviews ────────────────────────────────────────
export const MOCK_CREATOR_NOTIFICATIONS = [
  { id: 401, type: 'publish', icon: '🚀', text: 'Reel "Morning routine" published successfully on Instagram!', time: hoursAgo(1), isRead: false },
  { id: 402, type: 'warning', icon: '⚠️', text: 'Tesla account connection expires in 2 days. Re-auth required.', time: hoursAgo(4), isRead: false },
  { id: 403, type: 'review',  icon: '⏳', text: 'Draft "Brand Collab photoshoot" is ready & awaiting your final review.', time: hoursAgo(8), isRead: true },
  { id: 404, type: 'campaign',icon: '📅', text: 'Campaign "Brand Collaboration" deadline is in 4 days.', time: daysAgo(1), isRead: true },
];

// ── Connected Platforms Summary ──────────────────────────────────────────────
export const MOCK_CREATOR_PLATFORMS = [
  { id: 'facebook',  label: 'Facebook',  connected: true  },
  { id: 'linkedin',  label: 'LinkedIn',  connected: true  },
  { id: 'youtube',   label: 'YouTube',   connected: true  },
  { id: 'x',         label: 'X (Twitter)', connected: true  },
  { id: 'instagram', label: 'Instagram', connected: false },
  { id: 'pinterest', label: 'Pinterest', connected: false },
];
