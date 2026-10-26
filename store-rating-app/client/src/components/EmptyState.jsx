import { Store } from 'lucide-react';

export default function EmptyState({ title = 'Nothing to show', message, icon, children }) {
  return (
    <div className="empty-state">
      <div className="empty-icon" aria-hidden="true">{icon || <Store size={26} />}</div>
      <h3>{title}</h3>
      {message && <p>{message}</p>}
      {children}
    </div>
  );
}
