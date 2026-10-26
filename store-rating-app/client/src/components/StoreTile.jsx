import { Link } from 'react-router-dom';
import { Check, MapPin, Star, Store } from 'lucide-react';
import RatingDisplay from './RatingDisplay';
import { colorForName } from '../three/colors';

export default function StoreTile({ store, onRate, isMine = false }) {
  const color = colorForName(store.name);
  const hasRating = store.averageRating !== null && store.averageRating !== undefined;
  return (
    <article className="tile" aria-label={store.name}>
      <div className="tile-cover" style={{ background: `linear-gradient(160deg, ${color}, color-mix(in srgb, ${color} 62%, #0b1533))` }}>
        <span className="tile-mono" style={{ color }} aria-hidden="true">{store.name[0].toUpperCase()}</span>
        <span className={`tile-sign ${hasRating ? '' : 'empty'}`} aria-hidden="true">{hasRating ? store.averageRating.toFixed(1) : 'New'}</span>
      </div>
      <div className="tile-body">
        <div className="tile-main">
          <h3>{store.name}</h3>
          <p className="tile-addr"><MapPin size={14} aria-hidden="true" /><span>{store.address}</span></p>
        </div>
        <RatingDisplay value={store.averageRating} count={store.ratingCount} />
        <div className="tile-foot">
          {isMine ? (
            <>
              <span className="mine own"><Store size={13} aria-hidden="true" /> Your store</span>
              <Link className="btn btn-small btn-secondary" to="/owner">View my store</Link>
            </>
          ) : (<>
          {store.myRating ? (
            <span className="mine"><Check size={13} aria-hidden="true" /> You rated {store.myRating}</span>
          ) : (
            <span className="tile-count">Not rated by you</span>
          )}
          <button type="button" className={`btn btn-small ${store.myRating ? 'btn-secondary' : 'btn-primary'}`} onClick={() => onRate(store)}
            aria-label={`${store.myRating ? 'Modify rating for' : 'Rate'} ${store.name}`}>
            <Star size={14} aria-hidden="true" /> {store.myRating ? 'Modify rating' : 'Rate'}
          </button>
          </>)}
        </div>
      </div>
    </article>
  );
}
