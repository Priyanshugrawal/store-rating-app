import { useCallback, useEffect, useState } from 'react';
import StoreBrowser from '../../components/StoreBrowser';
import { CityScene } from '../../components/Scene';
import { useAuth } from '../../context/AuthContext';
import { listStores } from '../../services/storeService';

export default function UserDashboard() {
  const { user } = useAuth();
  const [city, setCity] = useState({ buildings: [], total: null, mine: null });

  const load = useCallback(() => {
    Promise.all([
      listStores({ page: 1, limit: 24, sortBy: 'rating', order: 'desc' }),
      listStores({ page: 1, limit: 1, ratedByMe: 'true' }),
    ])
      .then(([all, mine]) => setCity({
        buildings: all.data.map((s) => ({ name: s.name, rating: s.averageRating, count: s.ratingCount })),
        total: all.meta.total,
        mine: mine.meta.total,
      }))
      .catch(() => { /* the list below shows its own error; the hero just stays empty */ });
  }, []);
  useEffect(load, [load]);

  const first = user.name.split(' ')[0];
  return (
    <>
      <div className="hero hero-bleed">
        <div className="hero-inner">
          <div className="hero-copy">
            <h1>Hi {first}, which shop deserves a star today?</h1>
            <p>Every building below is a real store. The taller it stands, the better it is rated. Drag to look around.</p>
            {city.total !== null && (
              <div className="hero-meta">
                <div><strong className="tnum">{city.total}</strong><span>stores nearby</span></div>
                <div><strong className="tnum">{city.mine}</strong><span>rated by you</span></div>
              </div>
            )}
          </div>
          <CityScene buildings={city.buildings} label="3D neighbourhood of the top rated stores" />
        </div>
        {city.total > 24 && <span className="hero-hint">Showing the 24 best rated stores</span>}
      </div>
      <StoreBrowser onChanged={load} />
    </>
  );
}
