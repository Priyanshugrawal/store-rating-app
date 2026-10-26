import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import DataTable from '../../components/DataTable';
import FilterControls from '../../components/FilterControls';
import Pagination from '../../components/Pagination';
import ErrorMessage from '../../components/ErrorMessage';
import RatingDisplay from '../../components/RatingDisplay';
import Avatar from '../../components/Avatar';
import useListQuery from '../../hooks/useListQuery';
import { listUsers } from '../../services/adminService';
import { ROLE_LABELS, ROLE_OPTIONS } from '../../utils/constants';

const INITIAL = { sortBy: 'name', order: 'asc' };
const FILTERS = [
  { name: 'name', label: 'Name', type: 'text' },
  { name: 'email', label: 'Email', type: 'text' },
  { name: 'address', label: 'Address', type: 'text' },
  { name: 'role', label: 'Role', type: 'select', options: ROLE_OPTIONS },
];

export default function UsersPage() {
  const q = useListQuery(listUsers, INITIAL);
  const columns = [
    { key: 'name', header: 'Name', sortKey: 'name', render: (u) => <div className="cell-person"><Avatar name={u.name} /><strong>{u.name}</strong></div> },
    { key: 'email', header: 'Email', sortKey: 'email' },
    { key: 'address', header: 'Address', sortKey: 'address', render: (u) => <div className="cell-clip" title={u.address}>{u.address}</div> },
    { key: 'role', header: 'Role', sortKey: 'role', render: (u) => <span className={`role-pill role-${u.role.toLowerCase()}`}>{ROLE_LABELS[u.role]}</span> },
    { key: 'rating', header: 'Store rating', render: (u) => (u.role === 'OWNER' ? <RatingDisplay value={u.storeRating} /> : <span className="muted">-</span>) },
    { key: 'actions', header: 'Details', render: (u) => <Link className="btn btn-small btn-secondary" to={`/admin/users/${u.id}`} aria-label={`View details of ${u.name}`}>View</Link> },
  ];
  return (
    <>
      <div className="page-head">
        <div><h1>Users</h1><p className="muted">Everyone with an account: shoppers, store owners and administrators.</p></div>
        <Link className="btn btn-primary" to="/admin/users/new"><Plus size={17} aria-hidden="true" /> Add user</Link>
      </div>
      <div className="card card-flush">
        <FilterControls fields={FILTERS} values={q.params} onChange={q.setFilter} onReset={q.reset} />
        <div style={{ padding: q.error ? '16px 24px 0' : 0 }}><ErrorMessage message={q.error} onRetry={q.reload} /></div>
        <DataTable columns={columns} rows={q.items} loading={q.loading} sortBy={q.params.sortBy} order={q.params.order}
          onSort={q.toggleSort} emptyTitle="No users found" emptyMessage="Try clearing the filters or add a new user." />
        <Pagination meta={q.meta} onPage={q.setPage} />
      </div>
    </>
  );
}
