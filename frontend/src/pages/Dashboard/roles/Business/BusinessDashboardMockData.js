/**
 * BusinessDashboardMockData.js
 *
 * All mock data for the Business Dashboard.
 * Centralised here so the component stays clean.
 * Replace individual keys with real API calls as the backend grows.
 */

const now = Date.now();
const daysAgo = (n) => new Date(now - n * 86400000).toISOString();
const hoursAgo = (n) => new Date(now - n * 3600000).toISOString();

// ── Section 2: KPI stats ──────────────────────────────────────────────────────
export const MOCK_STATS = [
  { id: 'campaigns',  title: 'Total Campaigns',      value: '12',   change: 8,   trend: 'up'   },
  { id: 'scheduled',  title: 'Scheduled Posts',       value: '34',   change: 12,  trend: 'up'   },
  { id: 'published',  title: 'Published Posts',       value: '218',  change: -3,  trend: 'down' },
  { id: 'platforms',  title: 'Connected Platforms',   value: '5',    change: null, trend: 'neutral' },
  { id: 'analytics',  title: 'Analytics Score',       value: '82',   change: 4,   trend: 'up'   },
  { id: 'reports',    title: 'Pending Reports',       value: '3',    change: null, trend: 'neutral' },
];

// ── Section 3: Campaigns ──────────────────────────────────────────────────────
export const MOCK_CAMPAIGNS = [
  {
    id: 1,
    name: 'Summer Brand Refresh',
    status: 'active',
    progress: 72,
    team: 'Brand Studio',
    startDate: daysAgo(30),
    endDate: daysAgo(-15),
  },
  {
    id: 2,
    name: 'Q3 Product Launch',
    status: 'active',
    progress: 45,
    team: 'Growth Team',
    startDate: daysAgo(10),
    endDate: daysAgo(-30),
  },
  {
    id: 3,
    name: 'Holiday Season Push',
    status: 'planning',
    progress: 10,
    team: 'Digital Agency',
    startDate: daysAgo(-14),
    endDate: daysAgo(-90),
  },
  {
    id: 4,
    name: 'Influencer Partnership',
    status: 'completed',
    progress: 100,
    team: 'Influencer Team',
    startDate: daysAgo(90),
    endDate: daysAgo(5),
  },
  {
    id: 5,
    name: 'Brand Awareness APAC',
    status: 'paused',
    progress: 33,
    team: 'APAC Marketing',
    startDate: daysAgo(20),
    endDate: daysAgo(-45),
  },
];

// ── Section 4: Connected platforms ───────────────────────────────────────────
export const MOCK_PLATFORMS = [
  { id: 'facebook',  label: 'Facebook',  color: '#1877F2', status: 'connected',    lastSync: hoursAgo(2),  reach: '1.4M' },
  { id: 'instagram', label: 'Instagram', color: '#E1306C', status: 'connected',    lastSync: hoursAgo(1),  reach: '890K' },
  { id: 'linkedin',  label: 'LinkedIn',  color: '#0A66C2', status: 'connected',    lastSync: hoursAgo(3),  reach: '320K' },
  { id: 'youtube',   label: 'YouTube',   color: '#FF0000', status: 'connected',    lastSync: hoursAgo(5),  reach: '2.1M' },
  { id: 'x',         label: 'X (Twitter)', color: '#000000', status: 'disconnected', lastSync: null,        reach: null   },
  { id: 'pinterest', label: 'Pinterest', color: '#E60023', status: 'disconnected', lastSync: null,         reach: null   },
];

// ── Section 5: Scheduled posts ────────────────────────────────────────────────
export const MOCK_SCHEDULED = [
  { id: 1, platform: 'instagram', content: 'Summer collection is here! 🌊 Shop now...', scheduledAt: hoursAgo(-2),  campaign: 'Summer Brand Refresh', status: 'scheduled' },
  { id: 2, platform: 'facebook',  content: 'Exciting news for our loyal customers...', scheduledAt: hoursAgo(-5),  campaign: 'Q3 Product Launch',   status: 'scheduled' },
  { id: 3, platform: 'linkedin',  content: 'We are thrilled to announce our newest...', scheduledAt: hoursAgo(-8), campaign: 'Q3 Product Launch',   status: 'scheduled' },
  { id: 4, platform: 'youtube',   content: 'Behind the scenes: How we create our...', scheduledAt: hoursAgo(-24), campaign: 'Brand Awareness APAC', status: 'queued' },
];

// ── Section 6: Published posts ────────────────────────────────────────────────
export const MOCK_PUBLISHED = [
  { id: 1, platform: 'instagram', content: 'Introducing our refreshed brand identity.',  reach: '142K', likes: '8.2K', comments: '341', publishedAt: daysAgo(1)  },
  { id: 2, platform: 'facebook',  content: 'Our biggest sale of the year starts now.',   reach: '98K',  likes: '5.1K', comments: '207', publishedAt: daysAgo(2)  },
  { id: 3, platform: 'linkedin',  content: 'Celebrating 10 years of innovation.',        reach: '31K',  likes: '1.4K', comments: '88',  publishedAt: daysAgo(3)  },
  { id: 4, platform: 'youtube',   content: 'Product deep-dive: Everything you need.',    reach: '210K', likes: '14K',  comments: '892', publishedAt: daysAgo(4)  },
  { id: 5, platform: 'x',        content: 'The future is bright. Stay tuned for...',    reach: '55K',  likes: '3.2K', comments: '128', publishedAt: daysAgo(5)  },
];

// ── Section 7: Analytics charts (data for bars) ───────────────────────────────
export const MOCK_CAMPAIGN_PERF = [
  { label: 'Summer',      value: 72 },
  { label: 'Q3 Launch',   value: 45 },
  { label: 'APAC',        value: 33 },
  { label: 'Influencer',  value: 100 },
  { label: 'Holiday',     value: 10 },
];

export const MOCK_PLATFORM_DIST = [
  { label: 'Instagram', value: 34, color: '#E1306C' },
  { label: 'Facebook',  value: 27, color: '#1877F2' },
  { label: 'YouTube',   value: 22, color: '#FF0000' },
  { label: 'LinkedIn',  value: 12, color: '#0A66C2' },
  { label: 'X',         value: 5,  color: '#000000' },
];

export const MOCK_WEEKLY_ENG = [
  { label: 'Mon', value: 3200 },
  { label: 'Tue', value: 4800 },
  { label: 'Wed', value: 4100 },
  { label: 'Thu', value: 6200 },
  { label: 'Fri', value: 5700 },
  { label: 'Sat', value: 3900 },
  { label: 'Sun', value: 2800 },
];

export const MOCK_FOLLOWERS = [
  { label: 'Feb', value: 120 },
  { label: 'Mar', value: 185 },
  { label: 'Apr', value: 162 },
  { label: 'May', value: 240 },
  { label: 'Jun', value: 310 },
  { label: 'Jul', value: 280 },
];

// ── Section 8: Reports ────────────────────────────────────────────────────────
export const MOCK_REPORTS = [
  { id: 1, name: 'Weekly Performance Report',  type: 'weekly',    date: daysAgo(2),  size: '1.2 MB', icon: '📊' },
  { id: 2, name: 'Monthly Analytics Summary',  type: 'monthly',   date: daysAgo(5),  size: '4.8 MB', icon: '📈' },
  { id: 3, name: 'Q2 Campaign Report',          type: 'campaign',  date: daysAgo(12), size: '8.1 MB', icon: '📋' },
  { id: 4, name: 'Influencer Partnership ROI',  type: 'campaign',  date: daysAgo(20), size: '3.4 MB', icon: '🤝' },
];

// ── Section 9: Activity timeline ──────────────────────────────────────────────
export const MOCK_ACTIVITY = [
  { id: 1, icon: '📅', text: 'Marketing Team scheduled 3 posts for Instagram',   time: hoursAgo(1),  type: 'schedule'  },
  { id: 2, icon: '✅', text: 'Campaign "Influencer Partnership" marked complete',  time: hoursAgo(3),  type: 'success'   },
  { id: 3, icon: '📊', text: 'Monthly report generated and ready to download',    time: hoursAgo(5),  type: 'report'    },
  { id: 4, icon: '🔗', text: 'Facebook Business account re-connected',            time: hoursAgo(8),  type: 'connect'   },
  { id: 5, icon: '🔄', text: 'LinkedIn token refreshed automatically',             time: daysAgo(1),   type: 'sync'      },
  { id: 6, icon: '🚀', text: 'Campaign "Summer Brand Refresh" reached 72%',       time: daysAgo(1),   type: 'milestone' },
  { id: 7, icon: '📸', text: 'Instagram post published: 8.2K likes in 24h',      time: daysAgo(2),   type: 'publish'   },
];

// ── Section 10: Quick insights ────────────────────────────────────────────────
export const MOCK_INSIGHTS = [
  { id: 1, icon: '📈', title: 'Instagram engagement up 23%', body: 'Your Instagram posts are performing 23% better than last week. Peak hours are 6–8 PM.', type: 'positive' },
  { id: 2, icon: '⚠️', title: 'Facebook posting frequency is low', body: 'Only 2 posts this week on Facebook. The agency recommends at least 5 posts per week for optimal reach.', type: 'warning' },
  { id: 3, icon: '💡', title: 'LinkedIn performs best on Tuesdays', body: 'Your LinkedIn posts get 3× more impressions when published Tuesday 8–10 AM.', type: 'tip' },
  { id: 4, icon: '🎯', title: 'YouTube watch-time increased by 18%', body: 'Average view duration rose from 2:14 to 2:38 this month — a strong signal for the algorithm.', type: 'positive' },
];
