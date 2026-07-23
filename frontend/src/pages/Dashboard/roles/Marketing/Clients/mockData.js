/**
 * roles/Marketing/Clients/mockData.js
 *
 * Centralized mock data for client management and client workspaces.
 */

// ── Client Summary KPI cards ──────────────────────────────────────────────────
export const MOCK_CLIENT_KPI_STATS = [
  { id: 'total',    title: 'Total Clients',     value: '6',  change: null, trend: 'neutral' },
  { id: 'active',   title: 'Active Clients',    value: '4',  change: 1,    trend: 'up'      },
  { id: 'pending',  title: 'Pending Requests',  value: '2',  change: -1,   trend: 'down'    },
  { id: 'campaign', title: 'Active Campaigns',  value: '11', change: 3,    trend: 'up'      },
];

// ── Assigned Business Clients ─────────────────────────────────────────────────
export const INITIAL_MOCK_CLIENTS = [
  {
    id: 'nike',
    name: 'Nike',
    industry: 'Sportswear',
    profileImage: null,
    status: 'active',
    connectedPlatforms: ['instagram', 'facebook', 'youtube'],
    activeCampaigns: 3,
    scheduledPosts: 12,
    publishedPosts: 48,
    engagementRate: 6.8,
    lastActivity: 'Campaign "Summer Brand Refresh" updated 10m ago',
  },
  {
    id: 'puma',
    name: 'Puma',
    industry: 'Sportswear',
    profileImage: null,
    status: 'active',
    connectedPlatforms: ['instagram', 'x'],
    activeCampaigns: 2,
    scheduledPosts: 6,
    publishedPosts: 32,
    engagementRate: 5.2,
    lastActivity: 'Post scheduled for Instagram today at 6 PM',
  },
  {
    id: 'tesla',
    name: 'Tesla',
    industry: 'Automotive',
    profileImage: null,
    status: 'active',
    connectedPlatforms: ['linkedin', 'x', 'youtube'],
    activeCampaigns: 2,
    scheduledPosts: 8,
    publishedPosts: 64,
    engagementRate: 7.4,
    lastActivity: 'LinkedIn token refreshed automatically 4h ago',
  },
  {
    id: 'spotify',
    name: 'Spotify',
    industry: 'Entertainment',
    profileImage: null,
    status: 'active',
    connectedPlatforms: ['instagram', 'facebook', 'x'],
    activeCampaigns: 2,
    scheduledPosts: 4,
    publishedPosts: 28,
    engagementRate: 8.1,
    lastActivity: 'Report "June Audience Insights" generated yesterday',
  },
  {
    id: 'zomato',
    name: 'Zomato',
    industry: 'Food Delivery',
    profileImage: null,
    status: 'inactive',
    connectedPlatforms: ['instagram', 'facebook'],
    activeCampaigns: 0,
    scheduledPosts: 0,
    publishedPosts: 110,
    engagementRate: 4.9,
    lastActivity: 'Workspace paused by client request on Jul 15',
  },
];

// ── Incoming Pending Collaboration Requests ──────────────────────────────────
export const INITIAL_PENDING_REQUESTS = [
  {
    id: 'adidas-india',
    name: 'Adidas India',
    industry: 'Sportswear',
    profileImage: null,
    requestType: 'Social Media Management',
    timeRequested: '2 hours ago',
  },
  {
    id: 'samsung-global',
    name: 'Samsung Global',
    industry: 'Technology',
    profileImage: null,
    requestType: 'Campaign & Analytics Management',
    timeRequested: '5 hours ago',
  },
];

// ── Client Workspace Details & Section-specific Data ──────────────────────────
export const MOCK_CLIENT_WORKSPACES = {
  nike: {
    activeCampaignsList: [
      { id: 1, name: 'Nike Summer Sale', status: 'active', progress: 68, startDate: '2026-06-01', endDate: '2026-08-31' },
      { id: 2, name: 'Run the World 2026', status: 'active', progress: 42, startDate: '2026-07-01', endDate: '2026-09-30' },
      { id: 3, name: 'Air Max Anniversary', status: 'planning', progress: 10, startDate: '2026-08-15', endDate: '2026-10-15' },
    ],
    upcomingPosts: [
      { id: 11, time: 'Today 06:00 PM', platform: 'instagram', type: 'Reel', caption: 'Step into summer with the new Air Max collection 👟🌴', campaign: 'Nike Summer Sale' },
      { id: 12, time: 'Tomorrow 10:00 AM', platform: 'facebook', type: 'Post', caption: 'Join the global movement. Start your running journey today.', campaign: 'Run the World 2026' },
      { id: 13, time: 'Friday 03:30 PM', platform: 'youtube', type: 'Short', caption: 'Stretching routine with Olympic gold medalist Sally Jones 🏃‍♀️🏅', campaign: 'Run the World 2026' },
    ],
    publishedPosts: [
      { id: 21, platform: 'instagram', content: 'Our refreshed brand identity — live today.', publishTime: '2 days ago', reach: '145K', engagement: '6.4%' },
      { id: 22, platform: 'facebook', content: 'The biggest event of the year. Grab your tickets now.', publishTime: '4 days ago', reach: '92K', engagement: '4.8%' },
      { id: 23, platform: 'youtube', content: 'Nike Running App deep dive tutorial video.', publishTime: '1 week ago', reach: '210K', engagement: '8.2%' },
    ],
    activityTimeline: [
      { id: 31, type: 'campaign', text: 'Campaign "Air Max Anniversary" planned by Growth Studio', time: '1 hour ago' },
      { id: 32, type: 'post', text: 'Reel post scheduled for Instagram today at 6:00 PM', time: '3 hours ago' },
      { id: 33, type: 'publish', text: 'Video tutorial published on YouTube channel', time: '1 week ago' },
      { id: 34, type: 'report', text: 'Monthly Performance Analytics PDF report generated', time: '2 weeks ago' },
    ]
  },
  puma: {
    activeCampaignsList: [
      { id: 1, name: 'Puma Forever Faster', status: 'active', progress: 85, startDate: '2026-05-15', endDate: '2026-07-31' },
      { id: 2, name: 'Puma x Rihanna Collab', status: 'active', progress: 50, startDate: '2026-07-01', endDate: '2026-08-31' },
    ],
    upcomingPosts: [
      { id: 11, time: 'Today 06:00 PM', platform: 'instagram', type: 'Post', caption: 'Lightning fast. Forever faster ⚡️🐾', campaign: 'Puma Forever Faster' },
      { id: 12, time: 'Friday 02:00 PM', platform: 'x', type: 'Tweet', caption: 'Puma x Rihanna collection drops this Friday. Preview here.', campaign: 'Puma x Rihanna Collab' },
    ],
    publishedPosts: [
      { id: 21, platform: 'instagram', content: 'Puma street culture style preview drop.', publishTime: '1 day ago', reach: '88K', engagement: '5.1%' },
      { id: 22, platform: 'x', content: 'Puma official athletics track tournament sponsorship announcement.', publishTime: '3 days ago', reach: '54K', engagement: '3.6%' },
    ],
    activityTimeline: [
      { id: 31, type: 'post', text: 'Instagram post scheduled today at 6:00 PM', time: '2 hours ago' },
      { id: 32, type: 'publish', text: 'Tweet published on Twitter account successfully', time: '3 days ago' },
    ]
  },
  tesla: {
    activeCampaignsList: [
      { id: 1, name: 'Tesla Q3 Sustainability', status: 'active', progress: 92, startDate: '2026-06-01', endDate: '2026-08-15' },
      { id: 2, name: 'Model S Plaid Reveal', status: 'planning', progress: 5, startDate: '2026-09-01', endDate: '2026-10-31' },
    ],
    upcomingPosts: [
      { id: 11, time: 'Today 05:00 PM', platform: 'linkedin', type: 'Article', caption: 'How clean energy and EVs are transforming corporate fleet operations.', campaign: 'Tesla Q3 Sustainability' },
      { id: 12, time: 'Tomorrow 09:00 AM', platform: 'x', type: 'Tweet', caption: 'Plaid track record test results are in. 🏎️⚡️', campaign: 'Model S Plaid Reveal' },
    ],
    publishedPosts: [
      { id: 21, platform: 'linkedin', content: 'Tesla global battery gigafactory capacity statistics report.', publishTime: '2 days ago', reach: '120K', engagement: '7.8%' },
      { id: 22, platform: 'youtube', content: 'Autopilot FSD beta street test review video.', publishTime: '5 days ago', reach: '380K', engagement: '9.4%' },
    ],
    activityTimeline: [
      { id: 31, type: 'campaign', text: 'Campaign "Model S Plaid Reveal" created by Growth Studio', time: 'Yesterday' },
      { id: 32, type: 'publish', text: 'Autopilot review video published on YouTube', time: '5 days ago' },
    ]
  },
  spotify: {
    activeCampaignsList: [
      { id: 1, name: 'Spotify Wrapped Warmup', status: 'active', progress: 33, startDate: '2026-07-01', endDate: '2026-11-30' },
      { id: 2, name: 'Podcast Network Launch', status: 'active', progress: 75, startDate: '2026-06-15', endDate: '2026-08-15' },
    ],
    upcomingPosts: [
      { id: 11, time: 'Today 04:00 PM', platform: 'instagram', type: 'Story', caption: 'What is your top song of this summer? 🎧☀️ Let us know!', campaign: 'Spotify Wrapped Warmup' },
      { id: 12, time: 'Wednesday 11:00 AM', platform: 'facebook', type: 'Post', caption: 'Exclusive interview with the host of "True Crime Secrets" podcast.', campaign: 'Podcast Network Launch' },
    ],
    publishedPosts: [
      { id: 21, platform: 'instagram', content: 'Spotlight artist of the month interview clip.', publishTime: '3 days ago', reach: '95K', engagement: '6.2%' },
      { id: 22, platform: 'x', content: 'Spotify Premium pricing tier adjustments official updates release.', publishTime: '1 week ago', reach: '62K', engagement: '4.1%' },
    ],
    activityTimeline: [
      { id: 31, type: 'post', text: 'Instagram story post scheduled for today', time: '4 hours ago' },
      { id: 32, type: 'publish', text: 'Interview clip published on Instagram account', time: '3 days ago' },
    ]
  },
  zomato: {
    activeCampaignsList: [],
    upcomingPosts: [],
    publishedPosts: [
      { id: 21, platform: 'instagram', content: 'Midnight craving discounts: order now!', publishTime: 'Jul 14', reach: '180K', engagement: '7.2%' },
    ],
    activityTimeline: [
      { id: 31, type: 'system', text: 'Zomato client workspace deactivated/paused', time: 'Jul 15' }
    ]
  }
};
