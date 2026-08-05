/**
 * publishingMockData.js
 *
 * Centralized mock data for Module 5 — Publishing.
 * Structure mirrors the real API response shapes.
 * Once backend is live, these are replaced by real API calls in publishingService.js.
 *
 * ⚠️ Never import this inside components directly.
 *    Components should call repository or service functions only.
 */

export const PLATFORM_META = {
  facebook:  { label: 'Facebook',   color: '#1877F2', bgColor: 'rgba(24,119,242,0.1)',  icon: 'f'   },
  instagram: { label: 'Instagram',  color: '#E1306C', bgColor: 'rgba(225,48,108,0.1)',  icon: '📷'  },
  linkedin:  { label: 'LinkedIn',   color: '#0A66C2', bgColor: 'rgba(10,102,194,0.1)',  icon: 'in'  },
  youtube:   { label: 'YouTube',    color: '#FF0000', bgColor: 'rgba(255,0,0,0.1)',     icon: '▶'   },
  x:         { label: 'X',          color: '#0f172a', bgColor: 'rgba(15,23,42,0.08)',   icon: '𝕏'   },
  pinterest: { label: 'Pinterest',  color: '#E60023', bgColor: 'rgba(230,0,35,0.1)',   icon: 'P'   },
};

export const POST_STATUSES = {
  scheduled:        { label: 'Scheduled',        color: '#4f46e5', bg: 'rgba(79,70,229,0.1)'  },
  queued:           { label: 'Queued',           color: '#0ea5e9', bg: 'rgba(14,165,233,0.1)' },
  publishing:       { label: 'Publishing',       color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  published:        { label: 'Published',        color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  failed:           { label: 'Failed',           color: '#ef4444', bg: 'rgba(239,68,68,0.1)'  },
  cancelled:        { label: 'Cancelled',        color: '#6b7280', bg: 'rgba(107,114,128,0.1)'},
  pending_approval: { label: 'Pending Approval', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
  retrying:         { label: 'Retrying',         color: '#f97316', bg: 'rgba(249,115,22,0.1)' },
  draft:            { label: 'Draft',            color: '#94a3b8', bg: 'rgba(148,163,184,0.1)'},
};

export const mockPublishingStats = {
  scheduledPosts: 12,
  publishedToday: 8,
  queueSize: 5,
  failedPosts: 2,
  pendingApproval: 3,
  cancelledPosts: 1,
};

export const mockPublishingTimeline = [
  { id: 1, time: '09:15 AM', platform: 'linkedin', caption: 'Q3 product roadmap update — we are shipping faster than ever!', status: 'published' },
  { id: 2, time: '10:30 AM', platform: 'instagram', caption: 'Behind the scenes of our design team\'s brainstorming session 🎨', status: 'published' },
  { id: 3, time: '11:00 AM', platform: 'facebook', caption: 'New blog post: How to increase your brand reach in 2026', status: 'failed' },
  { id: 4, time: '02:00 PM', platform: 'x', caption: 'Hot take: Consistency > Virality. Thread 👇', status: 'scheduled' },
  { id: 5, time: '04:30 PM', platform: 'youtube', caption: 'New tutorial: Setting up automated publishing with SocialPilot', status: 'scheduled' },
];

export const mockQueuePosts = [
  { id: 'q1', caption: 'Q3 product roadmap update for our enterprise clients.', platforms: ['linkedin', 'facebook'], scheduledFor: '2026-08-05T14:00:00Z', queuePosition: 1, status: 'scheduled', retryCount: 0, createdBy: 'Sourav Mahato' },
  { id: 'q2', caption: 'Behind the scenes of our new UI refresh 🚀', platforms: ['instagram'], scheduledFor: '2026-08-05T15:30:00Z', queuePosition: 2, status: 'queued', retryCount: 0, createdBy: 'Abdul Afnan' },
  { id: 'q3', caption: 'Monthly newsletter recap — top insights from July', platforms: ['facebook', 'x'], scheduledFor: '2026-08-05T17:00:00Z', queuePosition: 3, status: 'scheduled', retryCount: 0, createdBy: 'Sourav Mahato' },
  { id: 'q4', caption: 'How we grew followers by 42% in 3 months — case study', platforms: ['linkedin'], scheduledFor: '2026-08-06T09:00:00Z', queuePosition: 4, status: 'pending_approval', retryCount: 0, createdBy: 'Abdul Afnan' },
  { id: 'q5', caption: 'Summer collection launch — sneak peek', platforms: ['instagram', 'pinterest'], scheduledFor: '2026-08-06T11:00:00Z', queuePosition: 5, status: 'scheduled', retryCount: 1, createdBy: 'Sourav Mahato' },
];

export const mockPublishingLogs = [
  { id: 'log1', time: '2026-08-05T09:15:00Z', platform: 'linkedin', postCaption: 'Q3 roadmap update', status: 'published', apiResponse: '200 OK', duration: '1.2s', retryAttempts: 0, errorMessage: null },
  { id: 'log2', time: '2026-08-05T10:30:00Z', platform: 'instagram', postCaption: 'Behind the scenes', status: 'published', apiResponse: '201 Created', duration: '0.9s', retryAttempts: 0, errorMessage: null },
  { id: 'log3', time: '2026-08-05T11:00:00Z', platform: 'facebook', postCaption: 'New blog post: brand reach', status: 'failed', apiResponse: '403 Forbidden', duration: '2.1s', retryAttempts: 3, errorMessage: 'Access token expired — please reconnect your Facebook account.' },
  { id: 'log4', time: '2026-08-04T14:30:00Z', platform: 'x', postCaption: 'Hot take: Consistency > Virality', status: 'published', apiResponse: '200 OK', duration: '0.8s', retryAttempts: 0, errorMessage: null },
  { id: 'log5', time: '2026-08-04T16:00:00Z', platform: 'youtube', postCaption: 'Tutorial: Automated publishing', status: 'published', apiResponse: '200 OK', duration: '3.4s', retryAttempts: 0, errorMessage: null },
  { id: 'log6', time: '2026-08-03T10:00:00Z', platform: 'pinterest', postCaption: 'Summer collection preview', status: 'failed', apiResponse: '500 Internal Server Error', duration: '5.0s', retryAttempts: 2, errorMessage: 'Pinterest API rate limit exceeded. Retry in 15 minutes.' },
];

export const mockFailedPosts = [
  { id: 'f1', caption: 'New blog post: How to increase your brand reach in 2026', platforms: ['facebook'], failureReason: 'Access token expired — please reconnect your Facebook account.', failedAt: '2026-08-05T11:00:00Z', retryCount: 3 },
  { id: 'f2', caption: 'Summer collection launch — sneak peek', platforms: ['pinterest'], failureReason: 'Pinterest API rate limit exceeded.', failedAt: '2026-08-03T10:00:00Z', retryCount: 2 },
];

export const mockPlatformStatus = [
  { platform: 'linkedin',  connected: true,  publishedToday: 3, queued: 2, failed: 0, lastSync: '2026-08-05T09:15:00Z', health: 'healthy'  },
  { platform: 'instagram', connected: true,  publishedToday: 2, queued: 1, failed: 0, lastSync: '2026-08-05T10:30:00Z', health: 'healthy'  },
  { platform: 'facebook',  connected: true,  publishedToday: 1, queued: 2, failed: 1, lastSync: '2026-08-05T11:00:00Z', health: 'warning'  },
  { platform: 'youtube',   connected: true,  publishedToday: 1, queued: 0, failed: 0, lastSync: '2026-08-04T16:00:00Z', health: 'healthy'  },
  { platform: 'x',         connected: false, publishedToday: 0, queued: 0, failed: 0, lastSync: null,                   health: 'disconnected' },
  { platform: 'pinterest', connected: true,  publishedToday: 0, queued: 1, failed: 1, lastSync: '2026-08-03T10:00:00Z', health: 'error'    },
];
