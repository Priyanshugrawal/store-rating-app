import { useState } from 'react';
import { Star } from 'lucide-react';
import { RATING_LABELS } from '../utils/constants';

// Five big stars backed by real radio inputs (keyboard and screen-reader friendly).
export default function RatingInput({ value, onChange, name = 'rating', error }) {
  const [hover, setHover] = useState(0);
  const shown = hover || Number(value) || 0;
  return (
    <fieldset className="star-picker">
      <legend className="sr-only">Your rating from 1 to 5</legend>
      <div className="star-row" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <label key={n} className={n <= shown ? 'on' : ''} onMouseEnter={() => setHover(n)}>
            <input type="radio" name={name} value={n} checked={Number(value) === n} onChange={() => onChange(n)} aria-label={`${n} - ${RATING_LABELS[n]}`} />
            <Star size={44} fill="currentColor" strokeWidth={0} aria-hidden="true" />
          </label>
        ))}
      </div>
      <p className="star-word" aria-live="polite">{shown ? RATING_LABELS[shown] : 'Tap a star'}</p>
      {error && <p className="field-error" role="alert">{error}</p>}
    </fieldset>
  );
}
