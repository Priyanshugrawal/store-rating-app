import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Star, Store, Users, Vote } from 'lucide-react';
import { Kpi, KpiBand } from '../../components/Kpi';
import { AreaChart, Distribution } from '../../components/Charts';
import { CityScene } from '../../components/Scene';
import { BlockSkeleton } from '../../components/Skeleton';
import { Monogram } from '../../components/Avatar';
import ErrorMessage from '../../components/ErrorMessage';
import EmptyState from '../../components/EmptyState';
import { getDashboard } from '../../services/adminService';
import { getErrorMessage } from '../../services/api';

const n = (v) => Number(v || 0).toLocaleString();
const ago = (iso) => {
  const mins = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins} min ago`;
  if (mins < 60 * 24) return `${Math.round(mins / 60)} h ago`;
  return `${Math.round(mins / 1440)} d ago`;
};

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setError('');
    getDashboard().then(({ data }) => setStats(data)).catch((e) => setError(getErrorMessage(e)));
  }, []);
  useEffect(load, [load]);

  const buildings = (stats?.topStores || []).map((s) => ({ name: s.name, rating: s.averageRating, count: s.ratingCount }));
  const last14 = stats ? stats.ratingsPerDay.reduce((sum, d) => sum + d.count, 0) : 0;

  return (
    <>
      <div className="hero hero-bleed">
        <div className="hero-inner">
          <div className="hero-copy">
            <h1>The whole neighbourhood at a glance</h1>
            <p>The best rated stores, built to scale. Hover a building to see its score.</p>
            <div className="hero-actions">
              <Link className="btn btn-gold" to="/admin/stores/new"><Plus size={17} aria-hidden="true" /> Add a store</Link>
              <Link className="btn btn-ghost" style={{ color: '#fff', borderColor: 'rgba(255,255,255,.3)' }} to="/admin/users/new">Add a user</Link>
            </div>
          </div>
          {stats ? <CityScene buildings={buildings} label="3D skyline of the top rated stores" /> : <div className="scene" />}
        </div>
      </div>

      <ErrorMessage message={error} onRetry={load} />
      {!stats && !error && <BlockSkeleton height={110} />}
      {stats && (
        <>
          <KpiBand>
            <Kpi icon={<Users size={16} aria-hidden="true" />} label="Total users" value={n(stats.totalUsers)}
              note={`${n(stats.usersByRole.USER)} shoppers, ${n(stats.usersByRole.OWNER)} owners`} />
            <Kpi icon={<Store size={16} aria-hidden="true" />} label="Total stores" value={n(stats.totalStores)} />
            <Kpi icon={<Vote size={16} aria-hidden="true" />} label="Total ratings submitted" value={n(stats.totalRatings)} note={`${n(last14)} in the last 14 days`} />
            <Kpi icon={<Star size={16} aria-hidden="true" />} label="Average rating" value={stats.averageRating == null ? '-' : stats.averageRating.toFixed(1)} note="across every store" />
          </KpiBand>

          <div className="grid-2">
            <section className="card" aria-labelledby="trend-title">
              <div className="card-head"><h2 id="trend-title">Ratings over the last 14 days</h2></div>
              <AreaChart points={stats.ratingsPerDay} />
            </section>
            <section className="card" aria-labelledby="dist-title">
              <div className="card-head"><h2 id="dist-title">How people score</h2></div>
              <Distribution distribution={stats.distribution} />
            </section>
          </div>

          <div className="grid-eq">
            <section className="card" aria-labelledby="top-title">
              <div className="card-head"><h2 id="top-title">Top rated stores</h2><Link to="/admin/stores" className="small">All stores</Link></div>
              {stats.topStores.length === 0 ? <EmptyState title="No ratings yet" message="Stores appear here once people rate them." /> : (
                <ol className="rank-list">
                  {stats.topStores.slice(0, 6).map((s) => (
                    <li key={s.id}>
                      <Monogram name={s.name} />
                      <div style={{ minWidth: 0 }}><div className="rank-name">{s.name}</div><div className="rank-sub">{s.ratingCount} ratings</div></div>
                      <span className="score"><Star size={15} fill="currentColor" strokeWidth={0} aria-hidden="true" />{s.averageRating.toFixed(1)}</span>
                    </li>
                  ))}
                </ol>
              )}
            </section>
            <section className="card" aria-labelledby="recent-title">
              <div className="card-head"><h2 id="recent-title">Latest ratings</h2></div>
              {stats.recentRatings.length === 0 ? <EmptyState title="Nothing yet" message="New ratings show up here as they come in." /> : (
                <ul className="rank-list activity">
                  {stats.recentRatings.map((r) => (
                    <li key={r.id}>
                      <Monogram name={r.store.name} />
                      <div style={{ minWidth: 0 }}>
                        <div className="rank-name">{r.store.name}</div>
                        <div className="rank-sub">{r.user.name} rated it, {ago(r.at)}</div>
                      </div>
                      <span className="score"><Star size={15} fill="currentColor" strokeWidth={0} aria-hidden="true" />{r.rating}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </>
      )}
    </>
  );
}
