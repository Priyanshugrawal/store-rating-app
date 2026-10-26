import { useEffect, useState } from 'react';
import ConfirmDialog from './ConfirmDialog';
import RatingInput from './RatingInput';
import { Monogram } from './Avatar';
import { RATING_LABELS } from '../utils/constants';

/** Lets a normal user submit a new rating or modify an existing one. */
export default function RatingModal({ store, busy, onSave, onClose }) {
  const [value, setValue] = useState(store?.myRating || 0);
  const [error, setError] = useState('');
  useEffect(() => {
    setValue(store?.myRating || 0);
    setError('');
  }, [store]);

  if (!store) return null;
  const isUpdate = Boolean(store.myRating);

  const save = () => {
    if (!value) return setError('Choose a rating from 1 to 5');
    if (isUpdate && value === store.myRating) return setError('This is already your current rating');
    return onSave(value);
  };

  return (
    <ConfirmDialog
      open
      title={isUpdate ? 'Modify your rating' : 'Rate this store'}
      confirmLabel={isUpdate ? 'Update rating' : 'Submit rating'}
      busy={busy}
      onConfirm={save}
      onCancel={onClose}
    >
      <div className="modal-store">
        <Monogram name={store.name} />
        <div>
          <strong>{store.name}</strong>
          {isUpdate && <div className="muted small">Your current rating: {store.myRating} ({RATING_LABELS[store.myRating]})</div>}
        </div>
      </div>
      <RatingInput value={value} onChange={(v) => { setValue(v); setError(''); }} error={error} />
    </ConfirmDialog>
  );
}
