import { useCallback, useEffect, useState } from 'react';
import { MapPin, Mail } from 'lucide-react';
import OpenStore from './OpenStore';
import { ShopScene } from '../../components/Scene';
import { Distribution } from '../../components/Charts';
import { BlockSkeleton } from '../../components/Skeleton';
import ErrorMessage from '../../components/ErrorMessage';
import DataTable from '../../components/DataTable';
import Pagination from '../../components/Pagination';
import Avatar from '../../components/Avatar';
import RatingDisplay from '../../components/RatingDisplay';
import useListQuery from '../../hooks/useListQuery';
import { getDashboard, listRatings } from '../../services/ownerService';
import { getErrorMessage } from '../../services/api';
import { RATING_LABELS } from '../../utils/constants';
import { formatDateTime } from '../../utils/format';

const INITIAL = { sortBy: 'createdAt', order: 'desc' };

function RatingsTable() {
  const q = useListQuery(listRatings, INITIAL);
  const columns = [
    { key: 'userName', header: 'User', sortKey: 'userName', render: (r) => <div className="cell-person"><Avatar name={r.user.name} /><strong>{r.user.name}</strong></div> },
    { key: 'userEmail', header: 'Email', sortKey: 'userEmail', render: (r) => r.user.email },
    { key: 'rating', header: 'Rating', sortKey: 'rating', render: (r) => <span><strong>{r.rating}</strong> <span className="muted small">({RATING_LABELS[r.rating]})</span></span> },
    { key: 'createdAt', header: 'Submitted', sortKey: 'createdAt', render: (r) => formatDateTime(r.submittedAt) },
  ];

  return (
    <section className="card card-flush" style={{ marginTop: 18 }}>
      <div className="card-pad" style={{ paddingBottom: 12 }}><h2>Users who rated your store</h2></div>
      <div style={{ padding: q.error ? '0 24px' : 0 }}><ErrorMessage message={q.error} onRetry={q.reload} /></div>
      <DataTable columns={columns} rows={q.items} loading={q.loading} sortBy={q.params.sortBy} order={q.params.order}
        onSort={q.toggleSort} emptyTitle="No ratings yet" emptyMessage="When customers rate your store, they will appear here." />
      <Pagination meta={q.meta} onPage={q.setPage} />
    </section>
  );
}

export default function OwnerDashboard() {
  const [dash, setDash] = useState(null);
  const [noStore, setNoStore] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setError('');
    getDashboard()
      .then(({ data }) => { setNoStore(false); setDash(data); })
      .catch((e) => {
        // 404 = this account has no store yet: offer to open one
        if (e.response?.status === 404) setNoStore(true);
        else setError(getErrorMessage(e));
      });
  }, []);
  useEffect(load, [load]);

  if (noStore) return <OpenStore onCreated={load} />;

  return (
    <>
      <div className="hero hero-bleed owner-hero">
        <div className="hero-inner">
          <div className="hero-copy">
            {dash ? (
              <>
                <h1>{dash.store.name}</h1>
                <p style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}><MapPin size={17} style={{ marginTop: 4, flex: 'none' }} aria-hidden="true" />{dash.store.address}</p>
                <p style={{ marginTop: 4, display: 'flex', gap: 8, alignItems: 'center' }}><Mail size={16} aria-hidden="true" />{dash.store.email}</p>
                <div className="big-score" role="group" aria-label="Average rating">
                  <strong className="tnum">{dash.averageRating === null ? '-' : dash.averageRating.toFixed(1)}</strong>
                  <span>{dash.averageRating === null ? 'No ratings yet' : `out of 5, from ${dash.ratingCount} ${dash.ratingCount === 1 ? 'rating' : 'ratings'}`}</span>
                </div>
              </>
            ) : (
              <h1>{error ? 'My store' : 'Loading your store'}</h1>
            )}
          </div>
          {dash ? <ShopScene name={dash.store.name} rating={dash.averageRating} /> : <div className="scene" />}
        </div>
      </div>

      <ErrorMessage message={error} onRetry={load} />
      {!dash && !error && <BlockSkeleton height={160} />}
      {dash && (
        <div className="grid-eq" style={{ marginTop: 0 }}>
          <section className="card" aria-labelledby="dist-title">
            <div className="card-head"><h2 id="dist-title">Rating breakdown</h2><RatingDisplay value={dash.averageRating} showNumber={false} /></div>
            <Distribution distribution={dash.distribution} />
          </section>
          <section className="card" aria-labelledby="count-title">
            <div className="card-head"><h2 id="count-title">Ratings received</h2></div>
            <div className="kpi-value tnum" style={{ marginTop: 0 }}>{dash.ratingCount}</div>
            <p className="muted" style={{ marginTop: 8 }}>
              {dash.ratingCount === 0
                ? 'When customers rate your store, their scores will appear here.'
                : `${dash.distribution[5] + dash.distribution[4]} of them are 4 or 5 stars.`}
            </p>
          </section>
        </div>
      )}

      {dash && <RatingsTable />}
    </>
  );
}
