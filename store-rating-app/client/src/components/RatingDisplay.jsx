import { Star } from 'lucide-react';

// Read-only stars. `value` may be a decimal (e.g. 3.7) or null.
export default function RatingDisplay({ value, count, showNumber = true, size = 16 }) {
  if (value === null || value === undefined) {
    return <span className="muted small">No ratings yet</span>;
  }
  const rounded = Math.round(value);
  return (
    <span className="rating-display" title={`${Number(value).toFixed(2)} out of 5`}>
      <span className="stars" role="img" aria-label={`${Number(value).toFixed(1)} out of 5 stars`}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Star key={n} size={size} className={n <= rounded ? 'on' : ''} fill="currentColor" strokeWidth={0} aria-hidden="true" />
        ))}
      </span>
      {showNumber && <strong className="rating-number">{Number(value).toFixed(1)}</strong>}
      {count !== undefined && <span className="muted small">({count})</span>}
    </span>
  );
}
