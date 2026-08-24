/**
 * shared/constants.js
 *
 * Centralised role constants and display labels.
 * Never hardcode role strings anywhere else.
 */

export const ROLES = {
  BUSINESS: 'business',
  MARKETING: 'marketing',
  CREATOR: 'creator',
  ADMIN: 'admin',
};

export const ROLE_LABELS = {
  [ROLES.BUSINESS]: 'Business',
  [ROLES.MARKETING]: 'Marketing',
  [ROLES.CREATOR]: 'Creator',
  [ROLES.ADMIN]: 'Administrator',
};

/**
 * Map backend role strings (from the DB / JWT) to our canonical role keys.
 * Add more mappings here as the backend evolves.
 */
export const ROLE_MAP = {
  business: ROLES.BUSINESS,
  business_user: ROLES.BUSINESS,
  'business user': ROLES.BUSINESS,
  marketing: ROLES.MARKETING,
  marketing_team: ROLES.MARKETING,
  'marketing team': ROLES.MARKETING,
  creator: ROLES.CREATOR,
  content_creator: ROLES.CREATOR,
  'content creator': ROLES.CREATOR,
  admin: ROLES.ADMIN,
  administrator: ROLES.ADMIN,
};

/** Returns a canonical ROLES value from any backend-supplied role string. */
export function resolveRole(rawRole) {
  if (!rawRole) return ROLES.BUSINESS;
  return ROLE_MAP[rawRole.toLowerCase()] ?? ROLES.BUSINESS;
}

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
