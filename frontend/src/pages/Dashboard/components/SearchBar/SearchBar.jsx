/**
 * components/SearchBar/SearchBar.jsx
 *
 * Reusable search bar component.
 * Props: value, onChange, placeholder, onSubmit, className
 */

import { MdSearch } from 'react-icons/md';
import './SearchBar.css';

export default function SearchBar({
  value,
  onChange,
  placeholder = 'Search…',
  onSubmit,
  className = '',
}) {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && onSubmit) onSubmit(value);
  };

  return (
    <div className={`sp-search-bar ${className}`}>
      <MdSearch className="sp-search-bar__icon" />
      <input
        type="search"
        className="sp-search-bar__input"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        onKeyDown={handleKeyDown}
        aria-label={placeholder}
      />
    </div>
  );
}
