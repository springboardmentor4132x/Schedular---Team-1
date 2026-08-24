/**
 * shared/dashboardRoutes.js
 *
 * Central route definitions per role.
 * Lazy-loaded page components are wired here so App.jsx stays clean.
 */

export const BUSINESS_ROUTES = [
  { path: '/business/dashboard', pageKey: 'BusinessDashboard' },
  { path: '/business/campaigns', pageKey: 'BusinessCampaigns' },
  { path: '/business/scheduled', pageKey: 'BusinessScheduled' },
  { path: '/business/published', pageKey: 'BusinessPublished' },
  { path: '/business/analytics', pageKey: 'BusinessAnalytics' },
  { path: '/business/reports',   pageKey: 'BusinessReports'   },
];

export const MARKETING_ROUTES = [
  { path: '/marketing/dashboard',      pageKey: 'MarketingDashboard'   },
  { path: '/marketing/clients',        pageKey: 'MarketingClients'     },
  { path: '/marketing/campaigns',      pageKey: 'MarketingCampaigns'   },
  { path: '/marketing/scheduling',     pageKey: 'MarketingScheduling'  },
  { path: '/marketing/calendar',       pageKey: 'MarketingCalendar'    },
  { path: '/marketing/analytics',      pageKey: 'MarketingAnalytics'   },
  { path: '/marketing/reports',        pageKey: 'MarketingReports'     },
  { path: '/marketing/notifications',  pageKey: 'MarketingNotifications'},
];

export const CREATOR_ROUTES = [
  { path: '/creator/dashboard',      pageKey: 'CreatorDashboard'   },
  { path: '/creator/posts',          pageKey: 'CreatorPosts'       },
  { path: '/creator/scheduling',     pageKey: 'CreatorScheduling'  },
  { path: '/creator/campaigns',      pageKey: 'CreatorCampaigns'   },
  { path: '/creator/calendar',       pageKey: 'CreatorCalendar'    },
  { path: '/creator/notifications',  pageKey: 'CreatorNotifications'},
];

export const ADMIN_ROUTES = [
  { path: '/admin/dashboard',        pageKey: 'AdminDashboard'     },
];

/** Returns the default landing path for a given canonical role. */
export function getDefaultPath(role) {
  const defaults = {
    business:  '/business/dashboard',
    marketing: '/marketing/dashboard',
    creator:   '/creator/dashboard',
    admin:     '/admin/dashboard',
  };
  return defaults[role] ?? '/business/dashboard';
}
