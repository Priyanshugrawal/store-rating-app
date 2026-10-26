import { AlertCircle } from 'lucide-react';

export default function ErrorMessage({ message, onRetry }) {
  if (!message) return null;
  return (
    <div className="alert alert-error" role="alert">
      <span style={{ display: 'flex', gap: 10, alignItems: 'center' }}><AlertCircle size={18} aria-hidden="true" />{message}</span>
      {onRetry && (
        <button type="button" className="btn btn-small btn-secondary" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}
