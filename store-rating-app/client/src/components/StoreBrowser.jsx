import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LayoutGrid, List, SearchX, Star } from 'lucide-react';
import Pagination from './Pagination';
import SearchBar from './SearchBar';
import ErrorMessage from './ErrorMessage';
import EmptyState from './EmptyState';
import RatingModal from './RatingModal';
import StoreTile from './StoreTile';
import { TileSkeletons } from './Skeleton';
import useListQuery from '../hooks/useListQuery';
import { listStores, submitRating, updateRating } from '../services/storeService';
import { getErrorMessage } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

const SORTS = [
  { value: 'name:asc', label: 'Name, A to Z' },
  { value: 'name:desc', label: 'Name, Z to A' },
  { value: 'rating:desc', label: 'Best rated first' },
  { value: 'rating:asc', label: 'Lowest rated first' },
];

/** Searchable, sortable store grid where a normal user can submit / modify ratings. */
export default function StoreBrowser({ ratedByMe = false, onChanged }) {
  const toast = useToast();
  const { user } = useAuth();
  const q = useListQuery(listStores, { sortBy: 'name', order: 'asc', limit: 12, ratedByMe: ratedByMe ? 'true' : '' });
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState('grid');

  const save = async (value) => {
    setSaving(true);
    try {
      if (editing.myRating) await updateRating(editing.id, value);
      else await submitRating(editing.id, value);
      toast.success(editing.myRating ? 'Your rating was updated' : 'Thanks! Your rating was submitted');
      setEditing(null);
      q.reload();
      onChanged?.();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const onSort = (e) => {
    const [sortBy, order] = e.target.value.split(':');
    q.setFilter('sortBy', sortBy);
    q.setFilter('order', order);
  };
  const sortValue = `${q.params.sortBy}:${q.params.order}`;
  const searching = Boolean(q.params.search);

  return (
    <section aria-label="Stores">
      <div className="toolbar">
        <div className="toolbar-left" style={{ flex: 1 }}>
          <SearchBar value={q.params.search || ''} onChange={(v) => q.setFilter('search', v)} placeholder="Search by store name or address" label="Search stores by name or address" />
          <label className="sr-only" htmlFor="sort-select">Sort stores</label>
          <select id="sort-select" className="select" value={sortValue} onChange={onSort}>
            {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        <div className="toolbar-left">
          {q.meta && <span className="result-count" aria-live="polite">{q.meta.total} {q.meta.total === 1 ? 'store' : 'stores'}</span>}
          <div className="seg" role="group" aria-label="Layout">
            <button type="button" aria-pressed={view === 'grid'} aria-label="Grid view" onClick={() => setView('grid')}><LayoutGrid size={17} /></button>
            <button type="button" aria-pressed={view === 'list'} aria-label="List view" onClick={() => setView('list')}><List size={17} /></button>
          </div>
        </div>
      </div>

      <ErrorMessage message={q.error} onRetry={q.reload} />
      {q.loading && q.items.length === 0 ? (
        <TileSkeletons />
      ) : q.items.length === 0 ? (
        <div className="card">
          {ratedByMe && !searching ? (
            <EmptyState icon={<Star size={26} />} title="You have not rated any store yet" message="Pick a shop you have visited and give it a score from 1 to 5.">
              <Link className="btn btn-primary" to="/stores">Browse stores to rate</Link>
            </EmptyState>
          ) : (
            <EmptyState icon={<SearchX size={26} />} title="No stores found" message="Try a different name or a street, or clear the search." />
          )}
        </div>
      ) : (
        <div className={`tiles ${view === 'list' ? 'list' : ''}`} aria-busy={q.loading ? 'true' : 'false'}>
          {q.items.map((s) => <StoreTile key={s.id} store={s} onRate={setEditing} isMine={s.ownerId === user.id} />)}
        </div>
      )}
      <div style={{ marginTop: 18 }}><Pagination meta={q.meta} onPage={q.setPage} /></div>
      <RatingModal store={editing} busy={saving} onSave={save} onClose={() => setEditing(null)} />
    </section>
  );
}
