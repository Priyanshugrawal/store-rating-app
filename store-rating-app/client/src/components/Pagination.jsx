import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ meta, onPage }) {
  if (!meta || meta.total === 0) return null;
  const { page, totalPages, total, limit } = meta;
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  return (
    <nav className="pagination" aria-label="Pagination">
      <span className="muted small">Showing {from}-{to} of {total}</span>
      <div className="pagination-buttons">
        <button type="button" className="btn btn-secondary btn-small" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          <ChevronLeft size={16} aria-hidden="true" /> Previous
        </button>
        <span aria-current="page" className="page-indicator">Page {page} of {totalPages}</span>
        <button type="button" className="btn btn-secondary btn-small" disabled={page >= totalPages} onClick={() => onPage(page + 1)}>
          Next <ChevronRight size={16} aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
}
