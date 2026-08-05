/**
 * shared/sidebarConfig.js
 *
 * Defines sidebar navigation items per role.
 * Icons are string identifiers — the Sidebar component maps them to react-icons.
 * Keep this file pure data; no JSX, no imports from components.
 */

import { ROLES } from './constants';

// ─── Icon keys ────────────────────────────────────────────────────────────────
// These are resolved to react-icon components inside Sidebar.jsx

export const SIDEBAR_CONFIG = {
  [ROLES.BUSINESS]: [
    { label: 'Dashboard',         to: '/business/dashboard',  icon: 'MdDashboard'         },
    { label: 'Marketing Teams',   to: '/business/marketing-teams', icon: 'MdPeople'       },
    { label: 'Campaigns',         to: '/business/campaigns',  icon: 'MdCampaign'          },
    { label: 'Scheduled Posts',   to: '/business/scheduled',  icon: 'MdSchedule'          },
    { label: 'Published Posts',   to: '/business/published',  icon: 'MdCheckCircle'       },
    { label: 'Publishing Hub',    to: '/business/publishing', icon: 'MdEditCalendar'      },
    { label: 'Analytics Hub',     to: '/business/analytics/overview', icon: 'MdInsights'  },
    { label: 'Connect Apps',      to: '/connect-apps',        icon: 'MdLink'              },
    { label: 'Profile',           to: '/profile',             icon: 'MdPerson'            },
    { label: 'Settings',          to: '/settings',            icon: 'MdSettings'          },
  ],

  [ROLES.MARKETING]: [
    { label: 'Dashboard',          to: '/marketing/dashboard', icon: 'MdDashboard'        },
    { label: 'Clients',            to: '/marketing/clients',   icon: 'MdPeople'           },
    { label: 'Campaign Mgmt',      to: '/marketing/campaigns', icon: 'MdCampaign'         },
    { label: 'Content Scheduling', to: '/marketing/scheduling',icon: 'MdEditCalendar'     },
    { label: 'Publishing Calendar',to: '/marketing/calendar',  icon: 'MdCalendarMonth'    },
    { label: 'Publishing Hub',     to: '/marketing/publishing',icon: 'MdArticle'          },
    { label: 'Analytics Hub',      to: '/marketing/analytics/overview', icon: 'MdInsights'},
    { label: 'Notifications',      to: '/marketing/notifications', icon: 'MdNotificationsNone' },
    { label: 'Connect Apps',       to: '/connect-apps',        icon: 'MdLink'             },
    { label: 'Profile',            to: '/profile',             icon: 'MdPerson'           },
    { label: 'Settings',           to: '/settings',            icon: 'MdSettings'         },
  ],

  [ROLES.CREATOR]: [
    { label: 'Dashboard',          to: '/creator/dashboard',   icon: 'MdDashboard'        },
    { label: 'My Posts',           to: '/creator/posts',       icon: 'MdArticle'          },
    { label: 'Content Scheduling', to: '/creator/scheduling',  icon: 'MdEditCalendar'     },
    { label: 'Campaigns',          to: '/creator/campaigns',   icon: 'MdCampaign'         },
    { label: 'My Calendar',        to: '/creator/calendar',    icon: 'MdCalendarMonth'    },
    { label: 'Publishing Hub',     to: '/creator/publishing',  icon: 'MdArticle'          },
    { label: 'Analytics Hub',      to: '/creator/analytics/overview', icon: 'MdInsights'  },
    { label: 'Notifications',      to: '/creator/notifications', icon: 'MdNotificationsNone' },
    { label: 'Connect Apps',       to: '/connect-apps',        icon: 'MdLink'             },
    { label: 'Profile',            to: '/profile',             icon: 'MdPerson'           },
    { label: 'Settings',           to: '/settings',            icon: 'MdSettings'         },
  ],
};

/** Returns the sidebar items for a given canonical role. Falls back to business. */
export function getSidebarItems(role) {
  return SIDEBAR_CONFIG[role] ?? SIDEBAR_CONFIG[ROLES.BUSINESS];
}
