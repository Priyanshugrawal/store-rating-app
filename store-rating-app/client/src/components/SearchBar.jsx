import { Search } from 'lucide-react';

export default function SearchBar({ value, onChange, placeholder = 'Search...', label = 'Search' }) {
  return (
    <div className="search-field">
      <label htmlFor="search-input" className="sr-only">{label}</label>
      <Search size={18} aria-hidden="true" />
      <input id="search-input" type="search" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
