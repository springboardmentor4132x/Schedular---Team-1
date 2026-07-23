/**
 * contentMockData.js
 *
 * Centralized mock data repository for SocialPilot Scheduled Content / Posts.
 */

const now = Date.now();
const hoursAhead = (h) => new Date(now + h * 3600000).toISOString();
const daysAgo = (d) => new Date(now - d * 86400000).toISOString();

export const INITIAL_MOCK_POSTS = [
  // ── Marketing Client Nike Scheduled Content ─────────────────────────────────
  {
    id: 'post-nike-01',
    ownerType: 'marketing',
    ownerId: 'marketing-user-id',
    clientId: 'nike',
    caption: 'Step into summer with the new Air Max collection 👟🌴 #AirMax #SummerStyle',
    media: [
      { id: 'm-01', type: 'image', name: 'summer-airmax.jpg', previewUrl: '', size: 185000 }
    ],
    platforms: ['instagram', 'facebook'],
    campaignId: 'cmp-nike-summer',
    status: 'scheduled',
    scheduledAt: hoursAhead(24),
    createdAt: daysAgo(2),
    updatedAt: daysAgo(2),
  },
  {
    id: 'post-nike-02',
    ownerType: 'marketing',
    ownerId: 'marketing-user-id',
    clientId: 'nike',
    caption: 'Run the World running app challenge starts this weekend! Download and join the movement 🏃‍♂️💨',
    media: [],
    platforms: ['facebook', 'linkedin'],
    campaignId: 'cmp-nike-running',
    status: 'scheduled',
    scheduledAt: hoursAhead(48),
    createdAt: daysAgo(1),
    updatedAt: daysAgo(1),
  },
  {
    id: 'post-nike-03',
    ownerType: 'marketing',
    ownerId: 'marketing-user-id',
    clientId: 'nike',
    caption: 'Draft concept: Sneaker design retrospective and interview with product leads.',
    media: [],
    platforms: ['youtube', 'x'],
    campaignId: null,
    status: 'draft',
    scheduledAt: null,
    createdAt: daysAgo(3),
    updatedAt: daysAgo(3),
  },

  // ── Creator Prabhas Scheduled Content ───────────────────────────────────────
  {
    id: 'post-cr-01',
    ownerType: 'creator',
    ownerId: 'creator-user-id',
    clientId: null,
    caption: 'Baahubali 3 first look tease! Re-entering the kingdom of Mahishmati ⚔️👑 #Baahubali #Prabhas',
    media: [
      { id: 'm-c1', type: 'image', name: 'first-look.jpg', previewUrl: '', size: 320000 }
    ],
    platforms: ['instagram', 'facebook', 'youtube'],
    campaignId: 'cmp-cr-baahubali',
    status: 'scheduled',
    scheduledAt: hoursAhead(12),
    createdAt: daysAgo(1),
    updatedAt: daysAgo(1),
  },
  {
    id: 'post-cr-02',
    ownerType: 'creator',
    ownerId: 'creator-user-id',
    clientId: null,
    caption: 'Official full-length cinematic teaser release on YouTube channel tomorrow! #Salaar',
    media: [],
    platforms: ['youtube', 'x'],
    campaignId: 'cmp-cr-salaar',
    status: 'scheduled',
    scheduledAt: hoursAhead(20),
    createdAt: daysAgo(2),
    updatedAt: daysAgo(2),
  },
  {
    id: 'post-cr-03',
    ownerType: 'creator',
    ownerId: 'creator-user-id',
    clientId: null,
    caption: 'Brand photoshoot behind-the-scenes snippets. Coming soon.',
    media: [],
    platforms: ['instagram'],
    campaignId: null,
    status: 'draft',
    scheduledAt: null,
    createdAt: daysAgo(5),
    updatedAt: daysAgo(5),
  },
];
