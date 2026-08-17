/**
 * analyticsMockData.js
 *
 * Centralized mock data for SocialPilot Analytics.
 * Provides role-specific datasets for:
 * 1. Content Creator (individual creator presence)
 * 2. Marketing Team (campaign/multi-channel agency presence)
 * 3. Business (organization-level social presence)
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

// ─── 1. Content Creator Mock Data ───────────────────────────────────────────
export const creatorMockData = {
  overview: {
    totalPublishedPosts: 34,
    totalScheduledPosts: 8,
    totalImpressions: 64800,
    totalReach: 38200,
    totalEngagement: 5420,
    totalLikes: 4120,
    totalComments: 740,
    totalShares: 240,
    totalClicks: 860,
    totalFollowers: 15800,
    overallEngagementRate: 8.36,
  },
  content: [
    { id: 'cc1', caption: '5 tools I use every day as a solo content creator 🛠️', platforms: ['instagram', 'youtube'], campaign: 'Personal Branding', publishedAt: '2026-08-12T10:00:00Z', likes: 1120, comments: 145, shares: 82, saves: 310, reach: 9400, impressions: 14800, clicks: 310, engagementRate: 9.1 },
    { id: 'cc2', caption: 'My exact strategy for growing past 10k followers in 6 months 🚀', platforms: ['x', 'linkedin'], campaign: 'Growth Series', publishedAt: '2026-08-10T14:30:00Z', likes: 640, comments: 88, shares: 64, saves: 180, reach: 7200, impressions: 11600, clicks: 240, engagementRate: 7.7 },
    { id: 'cc3', caption: 'Behind the scenes: Desk setup tour & video editing workflow 🎧', platforms: ['instagram', 'pinterest'], campaign: 'Creator Life', publishedAt: '2026-08-08T11:15:00Z', likes: 1480, comments: 210, shares: 44, saves: 420, reach: 11800, impressions: 18400, clicks: 190, engagementRate: 11.6 },
    { id: 'cc4', caption: 'Quick Python script to automate video rendering in 2 minutes 💻', platforms: ['youtube', 'x'], campaign: 'Tech Tutorials', publishedAt: '2026-08-05T16:00:00Z', likes: 880, comments: 297, shares: 50, saves: 210, reach: 9800, impressions: 20000, clicks: 120, engagementRate: 7.2 },
  ],
  audience: {
    followers: 15800,
    newFollowers: 680,
    lostFollowers: 120,
    netGrowth: 560,
    genderDistribution: [
      { name: 'Male', value: 52 },
      { name: 'Female', value: 43 },
      { name: 'Other', value: 5 },
    ],
    ageDistribution: [
      { range: '18–24', value: 28 },
      { range: '25–34', value: 46 },
      { range: '35–44', value: 18 },
      { range: '45–54', value: 6  },
      { range: '55+',   value: 2  },
    ],
    countryDistribution: [
      { country: 'India', value: 34 },
      { country: 'United States', value: 28 },
      { country: 'United Kingdom', value: 14 },
      { country: 'Canada', value: 8 },
      { country: 'Germany', value: 6 },
      { country: 'Others', value: 10 },
    ],
    mostActiveHours: [0,0,0,0,1,2,5,10,16,22,28,32,38,30,24,20,18,22,30,36,32,24,14,6],
    mostActiveDays: [
      { day: 'Mon', value: 76 },
      { day: 'Tue', value: 84 },
      { day: 'Wed', value: 95 },
      { day: 'Thu', value: 92 },
      { day: 'Fri', value: 88 },
      { day: 'Sat', value: 68 },
      { day: 'Sun', value: 52 },
    ],
    followerGrowth: [
      { month: 'Mar', followers: 13200 },
      { month: 'Apr', followers: 13800 },
      { month: 'May', followers: 14400 },
      { month: 'Jun', followers: 14950 },
      { month: 'Jul', followers: 15240 },
      { month: 'Aug', followers: 15800 },
    ],
  },
  campaigns: [
    { id: 'cc-camp1', name: 'Personal Branding 2026', duration: '30 days', status: 'active', posts: 12, reach: 24800, impressions: 38400, engagement: 3400, clicks: 420, roi: 280, completion: 70 },
    { id: 'cc-camp2', name: 'Tech Tutorials Series', duration: '21 days', status: 'active', posts: 8, reach: 18200, impressions: 29000, engagement: 2100, clicks: 310, roi: 190, completion: 55 },
    { id: 'cc-camp3', name: 'Creator Gear Showcase', duration: '14 days', status: 'completed', posts: 6, reach: 14200, impressions: 21800, engagement: 1840, clicks: 280, roi: 340, completion: 100 },
  ],
  platforms: {
    instagram: { followers: 7400, reach: 18200, impressions: 29000, engagement: 2840, likes: 2200, comments: 380, shares: 140, clicks: 310 },
    youtube:   { followers: 3800, reach: 9400,  impressions: 16800, engagement: 1420, likes: 1100, comments: 240, shares: 50,  clicks: 290 },
    x:         { followers: 2900, reach: 6200,  impressions: 11200, engagement: 740,  likes: 540,  comments: 80,  shares: 40,  clicks: 160 },
    pinterest: { followers: 1700, reach: 4400,  impressions: 7800,  engagement: 420,  likes: 280,  comments: 40,  shares: 10,  clicks: 100 },
  },
};

// ─── 2. Marketing Team Mock Data ───────────────────────────────────────────
export const marketingMockData = {
  overview: {
    totalPublishedPosts: 146,
    totalScheduledPosts: 32,
    totalImpressions: 584000,
    totalReach: 348000,
    totalEngagement: 38600,
    totalLikes: 24800,
    totalComments: 5400,
    totalShares: 3900,
    totalClicks: 14200,
    totalFollowers: 86400,
    overallEngagementRate: 6.61,
  },
  content: [
    { id: 'mc1', caption: 'Q3 product roadmap update for enterprise clients 📊', platforms: ['linkedin', 'facebook'], campaign: 'Q3 Product Launch', publishedAt: '2026-08-11T09:15:00Z', likes: 1420, comments: 138, shares: 155, saves: 190, reach: 32400, impressions: 54800, clicks: 1340, engagementRate: 7.2 },
    { id: 'mc2', caption: 'Behind the scenes of our agency design sprint 🎨', platforms: ['instagram'], campaign: 'Brand Awareness', publishedAt: '2026-08-09T10:30:00Z', likes: 2840, comments: 288, shares: 134, saves: 410, reach: 48000, impressions: 85200, clicks: 1570, engagementRate: 9.8 },
    { id: 'mc3', caption: 'How our client boosted organic conversion by 48% — full case study 📈', platforms: ['linkedin', 'x'], campaign: 'Lead Gen Series', publishedAt: '2026-08-07T14:00:00Z', likes: 980, comments: 145, shares: 167, saves: 242, reach: 24800, impressions: 42200, clicks: 1410, engagementRate: 8.4 },
    { id: 'mc4', caption: 'Summer Promo 2026 — Exclusive client spotlight 🌟', platforms: ['instagram', 'pinterest'], campaign: 'Summer Promo 2026', publishedAt: '2026-08-04T11:00:00Z', likes: 3600, comments: 345, shares: 288, saves: 840, reach: 62000, impressions: 108000, clicks: 2890, engagementRate: 11.2 },
    { id: 'mc5', caption: 'Monthly marketing insights recap — key trends from July 💡', platforms: ['facebook', 'x'], campaign: 'Thought Leadership', publishedAt: '2026-08-02T09:00:00Z', likes: 710, comments: 92, shares: 141, saves: 165, reach: 18200, impressions: 31000, clicks: 680, engagementRate: 6.1 },
  ],
  audience: {
    followers: 86400,
    newFollowers: 2840,
    lostFollowers: 420,
    netGrowth: 2420,
    genderDistribution: [
      { name: 'Male', value: 48 },
      { name: 'Female', value: 47 },
      { name: 'Other', value: 5 },
    ],
    ageDistribution: [
      { range: '18–24', value: 15 },
      { range: '25–34', value: 42 },
      { range: '35–44', value: 28 },
      { range: '45–54', value: 11 },
      { range: '55+',   value: 4  },
    ],
    countryDistribution: [
      { country: 'United States', value: 38 },
      { country: 'India', value: 24 },
      { country: 'United Kingdom', value: 15 },
      { country: 'Canada', value: 10 },
      { country: 'Australia', value: 7 },
      { country: 'Others', value: 6 },
    ],
    mostActiveHours: [0,0,0,0,2,6,12,24,38,48,54,60,68,58,50,44,40,46,56,64,58,42,26,10],
    mostActiveDays: [
      { day: 'Mon', value: 84 },
      { day: 'Tue', value: 94 },
      { day: 'Wed', value: 100 },
      { day: 'Thu', value: 96 },
      { day: 'Fri', value: 86 },
      { day: 'Sat', value: 54 },
      { day: 'Sun', value: 40 },
    ],
    followerGrowth: [
      { month: 'Mar', followers: 74200 },
      { month: 'Apr', followers: 76800 },
      { month: 'May', followers: 79400 },
      { month: 'Jun', followers: 81900 },
      { month: 'Jul', followers: 83980 },
      { month: 'Aug', followers: 86400 },
    ],
  },
  campaigns: [
    { id: 'mc-camp1', name: 'Q3 Product Launch', duration: '30 days', status: 'active', posts: 24, reach: 115000, impressions: 188000, engagement: 12400, clicks: 4800, roi: 360, completion: 65 },
    { id: 'mc-camp2', name: 'Brand Awareness Q3', duration: '45 days', status: 'active', posts: 32, reach: 164000, impressions: 268000, engagement: 18200, clicks: 6400, roi: 240, completion: 50 },
    { id: 'mc-camp3', name: 'Summer Promo 2026', duration: '60 days', status: 'completed', posts: 45, reach: 280000, impressions: 450000, engagement: 34400, clicks: 14200, roi: 620, completion: 100 },
    { id: 'mc-camp4', name: 'Lead Gen Webinar', duration: '21 days', status: 'active', posts: 14, reach: 48000, impressions: 78000, engagement: 4900, clicks: 1820, roi: 210, completion: 40 },
  ],
  platforms: {
    linkedin:  { followers: 28400, reach: 124000, impressions: 210000, engagement: 14200, likes: 8800, comments: 2400, shares: 1800, clicks: 4200 },
    instagram: { followers: 26200, reach: 112000, impressions: 184000, engagement: 13800, likes: 9600, comments: 1800, shares: 1100, clicks: 3800 },
    facebook:  { followers: 18400, reach: 64000,  impressions: 110000, engagement: 6200,  likes: 4200, comments: 840,  shares: 680,  clicks: 2900 },
    x:         { followers: 8600,  reach: 28000,  impressions: 48000,  engagement: 2600,  likes: 1600, comments: 240,  shares: 220,  clicks: 1800 },
    youtube:   { followers: 4800,  reach: 20000,  impressions: 32000,  engagement: 1800,  likes: 1100, comments: 240,  shares: 100,  clicks: 1500 },
  },
};

// ─── 3. Business Mock Data ─────────────────────────────────────────────────
export const businessMockData = {
  overview: {
    totalPublishedPosts: 284,
    totalScheduledPosts: 56,
    totalImpressions: 1420000,
    totalReach: 840000,
    totalEngagement: 78400,
    totalLikes: 49200,
    totalComments: 11800,
    totalShares: 7400,
    totalClicks: 31600,
    totalFollowers: 164000,
    overallEngagementRate: 5.52,
  },
  content: [
    { id: 'bc1', caption: 'Announcing our Q3 Financial Results & Global Expansion Strategy 🚀', platforms: ['linkedin', 'x'], campaign: 'Corporate Milestone', publishedAt: '2026-08-12T08:30:00Z', likes: 3840, comments: 480, shares: 420, saves: 680, reach: 98000, impressions: 164000, clicks: 4200, engagementRate: 4.8 },
    { id: 'bc2', caption: 'Building sustainable supply chains: 2026 Executive Report 🌿', platforms: ['linkedin', 'facebook'], campaign: 'Sustainability 2026', publishedAt: '2026-08-10T10:00:00Z', likes: 2910, comments: 340, shares: 380, saves: 510, reach: 74000, impressions: 128000, clicks: 3100, engagementRate: 4.9 },
    { id: 'bc3', caption: 'Keynote Recap from the Annual Global Tech Summit 🎙️', platforms: ['youtube', 'linkedin'], campaign: 'Tech Summit 2026', publishedAt: '2026-08-06T15:00:00Z', likes: 4120, comments: 680, shares: 520, saves: 890, reach: 112000, impressions: 198000, clicks: 6800, engagementRate: 4.7 },
    { id: 'bc4', caption: 'Culture at SocialPilot: Meet our global engineering teams 🌐', platforms: ['instagram', 'linkedin'], campaign: 'Employer Branding', publishedAt: '2026-08-03T12:00:00Z', likes: 5200, comments: 610, shares: 340, saves: 980, reach: 86000, impressions: 142000, clicks: 2400, engagementRate: 7.2 },
  ],
  audience: {
    followers: 164000,
    newFollowers: 4680,
    lostFollowers: 820,
    netGrowth: 3860,
    genderDistribution: [
      { name: 'Male', value: 54 },
      { name: 'Female', value: 42 },
      { name: 'Other', value: 4 },
    ],
    ageDistribution: [
      { range: '18–24', value: 8  },
      { range: '25–34', value: 38 },
      { range: '35–44', value: 34 },
      { range: '45–54', value: 14 },
      { range: '55+',   value: 6  },
    ],
    countryDistribution: [
      { country: 'United States', value: 42 },
      { country: 'United Kingdom', value: 18 },
      { country: 'India', value: 16 },
      { country: 'Germany', value: 9 },
      { country: 'Canada', value: 8 },
      { country: 'Others', value: 7 },
    ],
    mostActiveHours: [0,0,0,0,4,12,28,52,78,92,108,124,136,128,112,98,84,92,106,120,110,82,48,18],
    mostActiveDays: [
      { day: 'Mon', value: 90 },
      { day: 'Tue', value: 98 },
      { day: 'Wed', value: 100 },
      { day: 'Thu', value: 94 },
      { day: 'Fri', value: 82 },
      { day: 'Sat', value: 42 },
      { day: 'Sun', value: 32 },
    ],
    followerGrowth: [
      { month: 'Mar', followers: 144000 },
      { month: 'Apr', followers: 148500 },
      { month: 'May', followers: 153000 },
      { month: 'Jun', followers: 157200 },
      { month: 'Jul', followers: 160140 },
      { month: 'Aug', followers: 164000 },
    ],
  },
  campaigns: [
    { id: 'bc-camp1', name: 'Global Enterprise Summit', duration: '45 days', status: 'active', posts: 38, reach: 310000, impressions: 520000, engagement: 28400, clicks: 12400, roi: 420, completion: 75 },
    { id: 'bc-camp2', name: 'Sustainability Initiative', duration: '60 days', status: 'active', posts: 42, reach: 240000, impressions: 410000, engagement: 21200, clicks: 8600, roi: 290, completion: 50 },
    { id: 'bc-camp3', name: 'Employer Brand Series', duration: '90 days', status: 'completed', posts: 68, reach: 480000, impressions: 820000, engagement: 46800, clicks: 18400, roi: 540, completion: 100 },
  ],
  platforms: {
    linkedin:  { followers: 68000, reach: 380000, impressions: 640000, engagement: 38400, likes: 24200, comments: 6400, shares: 4800, clicks: 14800 },
    facebook:  { followers: 42000, reach: 210000, impressions: 360000, engagement: 18200, likes: 11400, comments: 2800, shares: 1800, clicks: 7600 },
    x:         { followers: 28000, reach: 124000, impressions: 210000, engagement: 11400, likes: 7200,  comments: 1400, shares: 980,  clicks: 5200 },
    youtube:   { followers: 16000, reach: 84000,  impressions: 142000, engagement: 7200,  likes: 4600,  comments: 880,  shares: 240,  clicks: 3100 },
    instagram: { followers: 10000, reach: 42000,  impressions: 68000,  engagement: 3200,  likes: 1800,  comments: 320,  shares: 180,  clicks: 900 },
  },
};

// ─── Role Helper ────────────────────────────────────────────────────────────
export function getRoleDataset(role = 'marketing') {
  const normalized = String(role).toLowerCase();
  if (normalized.includes('creator')) return creatorMockData;
  if (normalized.includes('business')) return businessMockData;
  return marketingMockData;
}

// ─── Time-Series Trend Generator ───────────────────────────────────────────
export function generateTrendData(days = 30, role = 'marketing') {
  const data = [];
  const now = new Date();
  
  const scale = role === 'creator' ? 0.22 : (role === 'business' ? 2.4 : 1.0);
  const baseFollowers = role === 'creator' ? 14200 : (role === 'business' ? 152000 : 81000);

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    const wave1 = Math.sin(i * 0.35);
    const wave2 = Math.cos(i * 0.22);
    
    const reach = Math.round((4800 + wave1 * 1600 + Math.random() * 700) * scale);
    const impressions = Math.round((8200 + wave2 * 2500 + Math.random() * 1200) * scale);
    const engagement = Math.round((540 + wave1 * 140 + Math.random() * 90) * scale);
    const clicks = Math.round((210 + wave2 * 60 + Math.random() * 50) * scale);
    const posts = Math.round(1 + Math.floor((Math.sin(i) + 1) * 1.5));
    const followers = Math.round(baseFollowers + (days - i) * (24 * scale) + (i % 4) * 8);

    data.push({
      date: label,
      reach,
      impressions,
      engagement,
      followers,
      clicks,
      posts,
    });
  }
  return data;
}

// Preserve existing exports for backward compatibility if needed
export const mockAnalyticsOverview = marketingMockData.overview;
export const mockContentAnalytics = marketingMockData.content;
export const mockAudienceAnalytics = marketingMockData.audience;
export const mockCampaignAnalytics = marketingMockData.campaigns;
export const mockPlatformComparison = marketingMockData.platforms;
