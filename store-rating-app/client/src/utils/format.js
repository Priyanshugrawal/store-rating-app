export const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '-';

export const formatDateTime = (iso) =>
  iso
    ? new Date(iso).toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '-';

export const formatRating = (value) => (value === null || value === undefined ? 'No ratings yet' : Number(value).toFixed(1));
