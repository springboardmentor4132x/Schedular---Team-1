/**
 * components/Avatar/Avatar.jsx
 *
 * Reusable Avatar component.
 * Priority:  profileImage → initials (firstName + lastName) → fallback icon.
 */

import './Avatar.css';

function getInitials(firstName, lastName) {
  const f = (firstName ?? '').trim()[0] ?? '';
  const l = (lastName  ?? '').trim()[0] ?? '';
  return (f + l).toUpperCase() || '?';
}

export default function Avatar({ profileImage, firstName, lastName, size = 'md', className = '' }) {
  const initials = getInitials(firstName, lastName);

  const sizeClass = {
    xs:  'sp-avatar--xs',
    sm:  'sp-avatar--sm',
    md:  'sp-avatar--md',
    lg:  'sp-avatar--lg',
    xl:  'sp-avatar--xl',
  }[size] ?? 'sp-avatar--md';

  if (profileImage) {
    return (
      <img
        src={profileImage}
        alt={`${firstName ?? ''} ${lastName ?? ''}`.trim() || 'User'}
        className={`sp-avatar sp-avatar--img ${sizeClass} ${className}`}
      />
    );
  }

  return (
    <span className={`sp-avatar sp-avatar--initials ${sizeClass} ${className}`} aria-label={initials}>
      {initials}
    </span>
  );
}
