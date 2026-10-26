import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { BlockSkeleton } from '../../components/Skeleton';
import ErrorMessage from '../../components/ErrorMessage';
import RatingDisplay from '../../components/RatingDisplay';
import Avatar, { Monogram } from '../../components/Avatar';
import { getUser } from '../../services/adminService';
import { getErrorMessage } from '../../services/api';
import { ROLE_LABELS } from '../../utils/constants';
import { formatDateTime } from '../../utils/format';

export default function UserDetails() {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setError('');
    setUser(null);
    getUser(id).then(({ data }) => setUser(data)).catch((e) => setError(getErrorMessage(e)));
  }, [id]);
  useEffect(load, [load]);

  return (
    <>
      <div className="page-head">
        <h1>User details</h1>
        <Link className="btn btn-secondary" to="/admin/users"><ArrowLeft size={16} aria-hidden="true" /> Back to users</Link>
      </div>
      <ErrorMessage message={error} onRetry={load} />
      {!user && !error && <BlockSkeleton height={220} />}
      {user && (
        <div className="card">
          <div className="profile">
            <Avatar name={user.name} size="lg" />
            <div>
              <h2>{user.name}</h2>
              <span className={`role-pill role-${user.role.toLowerCase()}`}>{ROLE_LABELS[user.role]}</span>
            </div>
          </div>
          <dl className="details">
            <div><dt>Email</dt><dd>{user.email}</dd></div>
            <div><dt>Member since</dt><dd>{formatDateTime(user.createdAt)}</dd></div>
            {user.role === 'USER' && <div><dt>Ratings given</dt><dd>{user.ratingsGiven}</dd></div>}
            <div className="wide"><dt>Address</dt><dd>{user.address}</dd></div>
          </dl>
          {user.role === 'OWNER' && (
            <>
              <hr style={{ border: 0, borderTop: '1px solid var(--line)', margin: '26px 0' }} />
              <h2 style={{ marginBottom: 16 }}>Store</h2>
              {user.store ? (
                <>
                  <div className="profile"><Monogram name={user.store.name} /><strong>{user.store.name}</strong></div>
                  <dl className="details">
                    <div><dt>Store email</dt><dd>{user.store.email}</dd></div>
                    <div><dt>Average rating</dt><dd><RatingDisplay value={user.store.averageRating} count={user.store.ratingCount} /></dd></div>
                    <div className="wide"><dt>Store address</dt><dd>{user.store.address}</dd></div>
                  </dl>
                </>
              ) : (
                <p className="muted">No store assigned yet. <Link to="/admin/stores/new">Add a store</Link> for this owner.</p>
              )}
            </>
          )}
        </div>
      )}
    </>
  );
}
