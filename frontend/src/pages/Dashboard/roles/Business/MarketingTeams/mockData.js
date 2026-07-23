/**
 * roles/Business/MarketingTeams/mockData.js
 *
 * Centralized mock data for marketing team discovery and selection.
 */

// ── My Assigned Marketing Team ────────────────────────────────────────────────
export const INITIAL_MY_TEAM = {
  id: 'growth-labs',
  name: 'Growth Labs Media',
  profileImage: null,
  status: 'Approved',
  activeCampaigns: 3,
  scheduledPosts: 12,
  lastActivity: 'Scheduled Instagram Reel today at 6:00 PM',
  specialties: ['Social Media Management', 'Campaign Strategy', 'Brand Growth'],
  supportedPlatforms: ['instagram', 'facebook', 'youtube', 'linkedin'],
  experience: '5+ years',
  rating: 4.9,
};

// ── Discoverable/Available Marketing Teams ────────────────────────────────────
export const INITIAL_AVAILABLE_TEAMS = [
  {
    id: 'pixel-perfect',
    name: 'Pixel Perfect Agency',
    profileImage: null,
    description: 'High-impact visuals and creative campaign managers focusing on growth.',
    specialties: ['Content Marketing', 'Brand Growth', 'Social Media Management'],
    supportedPlatforms: ['instagram', 'facebook', 'x', 'pinterest'],
    activeClientCount: 14,
    experience: '3+ years',
    rating: 4.7,
    availabilityStatus: 'accepting_requests', // 'accepting_requests' | 'full'
  },
  {
    id: 'alpha-digital',
    name: 'Alpha Digital Hub',
    profileImage: null,
    description: 'Enterprise data-driven advertising and professional scheduling agency.',
    specialties: ['Analytics', 'Campaign Strategy', 'Social Media Management'],
    supportedPlatforms: ['linkedin', 'x', 'youtube', 'facebook'],
    activeClientCount: 22,
    experience: '8+ years',
    rating: 4.8,
    availabilityStatus: 'accepting_requests',
  },
  {
    id: 'creative-flow',
    name: 'Creative Flow Studio',
    profileImage: null,
    description: 'Boutique media studio crafting premium content for lifestyle & luxury brands.',
    specialties: ['Content Marketing', 'Brand Growth', 'Campaign Strategy'],
    supportedPlatforms: ['instagram', 'pinterest', 'youtube'],
    activeClientCount: 9,
    experience: '4+ years',
    rating: 4.9,
    availabilityStatus: 'accepting_requests',
  },
  {
    id: 'scale-force',
    name: 'ScaleForce Marketing',
    profileImage: null,
    description: 'Performance-driven digital marketing agency built for startups and scale-ups.',
    specialties: ['Brand Growth', 'Analytics', 'Social Media Management'],
    supportedPlatforms: ['facebook', 'instagram', 'x', 'linkedin'],
    activeClientCount: 30,
    experience: '6+ years',
    rating: 4.6,
    availabilityStatus: 'full',
  },
];
