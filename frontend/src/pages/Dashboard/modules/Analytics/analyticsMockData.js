/**
 * analyticsMockData.js
 *
 * Centralized mock data for Module 6 — Analytics Dashboard.
 * Structure mirrors the real /analytics and /reports API response shapes.
 *
 * ⚠️ Never import this inside components directly.
 *    Components must consume data through analyticsRepository or analyticsService.
 */

// ─── Platform Meta ───────────────────────────────────────────────────────────
export const PLATFORM_META = {
  facebook:  { label: 'Facebook',  color: '#1877F2', gradient: 'linear-gradient(135deg,#1877F2,#42a5f5)' },
  instagram: { label: 'Instagram', color: '#E1306C', gradient: 'linear-gradient(135deg,#833ab4,#E1306C,#fcaf45)' },
  linkedin:  { label: 'LinkedIn',  color: '#0A66C2', gradient: 'linear-gradient(135deg,#0A66C2,#00a0dc)' },
  youtube:   { label: 'YouTube',   color: '#FF0000', gradient: 'linear-gradient(135deg,#FF0000,#ff6b6b)' },
  x:         { label: 'X',         color: '#0f172a', gradient: 'linear-gradient(135deg,#0f172a,#475569)' },
  pinterest: { label: 'Pinterest', color: '#E60023', gradient: 'linear-gradient(135deg,#E60023,#f43f5e)' },
};

// ─── Overview KPI Mock ───────────────────────────────────────────────────────
export const mockAnalyticsOverview = {
  totalPublishedPosts: 84,
  totalScheduledPosts: 23,
  totalImpressions: 218500,
  totalReach: 156200,
  totalEngagement: 12430,
  totalLikes: 9800,
  totalComments: 1830,
  totalShares: 640,
  totalClicks: 2800,
  totalFollowers: 42600,
  overallEngagementRate: 7.96,
};

// ─── Trend Data ──────────────────────────────────────────────────────────────
export function generateTrendData(days = 30) {
  const data = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    data.push({
      date: label,
      reach: Math.round(3000 + Math.sin(i * 0.4) * 1200 + Math.random() * 800),
      impressions: Math.round(5000 + Math.sin(i * 0.3) * 2000 + Math.random() * 1200),
      engagement: Math.round(300 + Math.sin(i * 0.5) * 100 + Math.random() * 80),
      followers: Math.round(42000 + (days - i) * 20 + Math.random() * 50),
      clicks: Math.round(180 + Math.sin(i * 0.6) * 60 + Math.random() * 40),
      posts: Math.round(2 + Math.floor(Math.random() * 4)),
    });
  }
  return data;
}

// ─── Content Analytics Mock ──────────────────────────────────────────────────
export const mockContentAnalytics = [
  { id: 'ca1', caption: 'Q3 product roadmap update for enterprise clients', platforms: ['linkedin', 'facebook'], campaign: 'Q3 Launch', publishedAt: '2026-08-05T09:15:00Z', likes: 420, comments: 38, shares: 55, saves: 90, reach: 12400, impressions: 19800, clicks: 340, engagementRate: 8.1 },
  { id: 'ca2', caption: 'Behind the scenes of our design team\'s brainstorm session 🎨', platforms: ['instagram'], campaign: 'Brand Awareness', publishedAt: '2026-08-04T10:30:00Z', likes: 1240, comments: 88, shares: 34, saves: 210, reach: 28000, impressions: 45200, clicks: 570, engagementRate: 11.3 },
  { id: 'ca3', caption: 'How we grew followers by 42% in 3 months — full breakdown', platforms: ['linkedin'], campaign: 'Growth Campaign', publishedAt: '2026-08-03T14:00:00Z', likes: 318, comments: 45, shares: 67, saves: 142, reach: 9800, impressions: 16200, clicks: 410, engagementRate: 9.8 },
  { id: 'ca4', caption: 'Summer collection launch — exclusive first look 🌟', platforms: ['instagram', 'pinterest'], campaign: 'Summer 2026', publishedAt: '2026-08-02T11:00:00Z', likes: 2100, comments: 145, shares: 88, saves: 540, reach: 42000, impressions: 68000, clicks: 890, engagementRate: 14.2 },
  { id: 'ca5', caption: 'Monthly newsletter recap — top insights from July', platforms: ['facebook', 'x'], campaign: 'Newsletter', publishedAt: '2026-08-01T09:00:00Z', likes: 210, comments: 22, shares: 41, saves: 65, reach: 7200, impressions: 11000, clicks: 280, engagementRate: 6.4 },
  { id: 'ca6', caption: 'New tutorial: Setting up automated publishing', platforms: ['youtube', 'linkedin'], campaign: 'Education', publishedAt: '2026-07-31T16:00:00Z', likes: 540, comments: 92, shares: 78, saves: 230, reach: 18600, impressions: 30400, clicks: 1200, engagementRate: 12.6 },
];

// ─── Audience Analytics Mock ─────────────────────────────────────────────────
export const mockAudienceAnalytics = {
  followers: 42600,
  newFollowers: 1240,
  lostFollowers: 320,
  netGrowth: 920,
  genderDistribution: [
    { name: 'Male', value: 54 },
    { name: 'Female', value: 41 },
    { name: 'Other', value: 5 },
  ],
  ageDistribution: [
    { range: '18–24', value: 18 },
    { range: '25–34', value: 34 },
    { range: '35–44', value: 27 },
    { range: '45–54', value: 14 },
    { range: '55+',   value: 7  },
  ],
  countryDistribution: [
    { country: 'India', value: 38 },
    { country: 'United States', value: 24 },
    { country: 'United Kingdom', value: 12 },
    { country: 'Canada', value: 9 },
    { country: 'Australia', value: 6 },
    { country: 'Germany', value: 5 },
    { country: 'Others', value: 6 },
  ],
  mostActiveHours: [0,0,0,0,0,1,3,7,12,18,20,22,24,20,18,15,14,13,18,22,20,16,12,5],
  mostActiveDays: [
    { day: 'Mon', value: 82 },
    { day: 'Tue', value: 91 },
    { day: 'Wed', value: 100 },
    { day: 'Thu', value: 96 },
    { day: 'Fri', value: 88 },
    { day: 'Sat', value: 60 },
    { day: 'Sun', value: 44 },
  ],
  followerGrowth: [
    { month: 'Mar', followers: 38200 },
    { month: 'Apr', followers: 39400 },
    { month: 'May', followers: 40200 },
    { month: 'Jun', followers: 41100 },
    { month: 'Jul', followers: 41680 },
    { month: 'Aug', followers: 42600 },
  ],
};

// ─── Campaign Analytics Mock ─────────────────────────────────────────────────
export const mockCampaignAnalytics = [
  { id: 'camp1', name: 'Q3 Product Launch', duration: '30 days', status: 'active', posts: 18, reach: 85000, impressions: 138000, engagement: 7200, clicks: 3800, roi: 340, completion: 60 },
  { id: 'camp2', name: 'Brand Awareness Q3', duration: '45 days', status: 'active', posts: 24, reach: 124000, impressions: 198000, engagement: 14200, clicks: 5400, roi: 210, completion: 53 },
  { id: 'camp3', name: 'Summer Collection 2026', duration: '60 days', status: 'completed', posts: 32, reach: 210000, impressions: 340000, engagement: 28400, clicks: 12000, roi: 580, completion: 100 },
  { id: 'camp4', name: 'Back-to-School Campaign', duration: '21 days', status: 'draft', posts: 6, reach: 12000, impressions: 18400, engagement: 980, clicks: 420, roi: 0, completion: 28 },
  { id: 'camp5', name: 'Growth Hacking Series', duration: '14 days', status: 'completed', posts: 14, reach: 64000, impressions: 102000, engagement: 8600, clicks: 3200, roi: 190, completion: 100 },
];

// ─── Platform Comparison Mock ─────────────────────────────────────────────────
export const mockPlatformComparison = {
  facebook:  { followers: 12400, reach: 48000, impressions: 76000, engagement: 3800, likes: 2900, comments: 480, shares: 420, clicks: 2100 },
  instagram: { followers: 18200, reach: 68000, impressions: 110000, engagement: 9200, likes: 7800, comments: 940, shares: 460, clicks: 3200 },
  linkedin:  { followers: 7800,  reach: 24000, impressions: 38000, engagement: 2100, likes: 1400, comments: 320, shares: 380, clicks: 1800 },
  youtube:   { followers: 3200,  reach: 14000, impressions: 22000, engagement: 1800, likes: 1200, comments: 480, shares: 120, clicks: 4400 },
  x:         { followers: 4100,  reach: 9800,  impressions: 15000, engagement: 820,  likes: 640,  comments: 110, shares: 70,  clicks: 890 },
  pinterest: { followers: 2900,  reach: 11200, impressions: 18400, engagement: 1400, likes: 1200, comments: 90,  shares: 110, clicks: 2800 },
};
