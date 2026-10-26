import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import DataTable from '../../components/DataTable';
import FilterControls from '../../components/FilterControls';
import Pagination from '../../components/Pagination';
import ErrorMessage from '../../components/ErrorMessage';
import RatingDisplay from '../../components/RatingDisplay';
import { Monogram } from '../../components/Avatar';
import useListQuery from '../../hooks/useListQuery';
import { listStores } from '../../services/adminService';

const INITIAL = { sortBy: 'name', order: 'asc' };
const FILTERS = [
  { name: 'name', label: 'Name', type: 'text' },
  { name: 'email', label: 'Email', type: 'text' },
  { name: 'address', label: 'Address', type: 'text' },
];

export default function StoresPage() {
  const q = useListQuery(listStores, INITIAL);
  const columns = [
    { key: 'name', header: 'Store name', sortKey: 'name', render: (s) => <div className="cell-person"><Monogram name={s.name} /><strong>{s.name}</strong></div> },
    { key: 'email', header: 'Email', sortKey: 'email' },
    { key: 'address', header: 'Address', sortKey: 'address', render: (s) => <div className="cell-clip" title={s.address}>{s.address}</div> },
    { key: 'ownerName', header: 'Owner', render: (s) => s.ownerName || <span className="muted">Unassigned</span> },
    { key: 'rating', header: 'Average rating', sortKey: 'rating', render: (s) => <RatingDisplay value={s.averageRating} count={s.ratingCount} /> },
  ];
  return (
    <>
      <div className="page-head">
        <div><h1>Stores</h1><p className="muted">Every store on the platform with its live average rating.</p></div>
        <Link className="btn btn-primary" to="/admin/stores/new"><Plus size={17} aria-hidden="true" /> Add store</Link>
      </div>
      <div className="card card-flush">
        <FilterControls fields={FILTERS} values={q.params} onChange={q.setFilter} onReset={q.reset} />
        <div style={{ padding: q.error ? '16px 24px 0' : 0 }}><ErrorMessage message={q.error} onRetry={q.reload} /></div>
        <DataTable columns={columns} rows={q.items} loading={q.loading} sortBy={q.params.sortBy} order={q.params.order}
          onSort={q.toggleSort} emptyTitle="No stores found" emptyMessage="Add the first store, or clear the filters." />
        <Pagination meta={q.meta} onPage={q.setPage} />
      </div>
    </>
  );
}
