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
};

export const ROLE_LABELS = {
  [ROLES.BUSINESS]: 'Business',
  [ROLES.MARKETING]: 'Marketing',
  [ROLES.CREATOR]: 'Creator',
};

/**
 * Map backend role strings (from the DB / JWT) to our canonical role keys.
 * Add more mappings here as the backend evolves.
 */
export const ROLE_MAP = {
  business: ROLES.BUSINESS,
  business_user: ROLES.BUSINESS,
  marketing: ROLES.MARKETING,
  marketing_team: ROLES.MARKETING,
  creator: ROLES.CREATOR,
  content_creator: ROLES.CREATOR,
};

/** Returns a canonical ROLES value from any backend-supplied role string. */
export function resolveRole(rawRole) {
  if (!rawRole) return ROLES.BUSINESS;
  return ROLE_MAP[rawRole.toLowerCase()] ?? ROLES.BUSINESS;
}
