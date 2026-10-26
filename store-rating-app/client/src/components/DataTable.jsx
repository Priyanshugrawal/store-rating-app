import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';
import EmptyState from './EmptyState';
import { BlockSkeleton } from './Skeleton';

/**
 * columns: [{ key, header, sortKey?, render?(row), className? }]
 * A column with `sortKey` shows a clickable, keyboard-accessible header.
 */
export default function DataTable({ columns, rows, rowKey = 'id', sortBy, order, onSort, loading, emptyTitle, emptyMessage }) {
  return (
    <div className="table-wrap" aria-busy={loading ? 'true' : 'false'}>
      <table className="table">
        <thead>
          <tr>
            {columns.map((c) => {
              const active = c.sortKey && sortBy === c.sortKey;
              const Arrow = active ? (order === 'asc' ? ArrowUp : ArrowDown) : ChevronsUpDown;
              return (
                <th key={c.key} scope="col" className={c.className}
                  aria-sort={active ? (order === 'asc' ? 'ascending' : 'descending') : c.sortKey ? 'none' : undefined}>
                  {c.sortKey ? (
                    <button type="button" className="sort-btn" onClick={() => onSort(c.sortKey)}>
                      {c.header}
                      <Arrow size={14} aria-hidden="true" style={{ opacity: active ? 1 : 0.45 }} />
                    </button>
                  ) : (
                    c.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row[rowKey]}>
              {columns.map((c) => (
                <td key={c.key} data-label={c.header} className={c.className}>
                  {c.render ? c.render(row) : row[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {loading && rows.length === 0 && <div style={{ padding: 20 }}><BlockSkeleton height={180} /></div>}
      {!loading && rows.length === 0 && <EmptyState title={emptyTitle} message={emptyMessage} />}
    </div>
  );
}
