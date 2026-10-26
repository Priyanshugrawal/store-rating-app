import { useState } from 'react';
import { Store } from 'lucide-react';
import TextField from '../../components/TextField';
import ErrorMessage from '../../components/ErrorMessage';
import { ShopScene } from '../../components/Scene';
import useForm from '../../hooks/useForm';
import useDebounce from '../../hooks/useDebounce';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { createMyStore } from '../../services/ownerService';
import { getErrorMessage } from '../../services/api';
import { validateAddress, validateEmail, validateName } from '../../utils/validators';

const validate = (v) => ({ name: validateName(v.name), email: validateEmail(v.email), address: validateAddress(v.address) });

/** Shown on "My store" when the account has no store yet: open one with the same login. */
export default function OpenStore({ onCreated }) {
  const { refreshUser } = useAuth();
  const toast = useToast();
  const form = useForm({ name: '', email: '', address: '' }, validate);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const previewName = useDebounce(form.values.name.trim() || 'Your store', 500);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.validateAll()) return;
    setSubmitting(true);
    try {
      const v = form.values;
      await createMyStore({ name: v.name.trim(), email: v.email.trim(), address: v.address.trim() });
      toast.success('Your store is open');
      await refreshUser();
      onCreated();
    } catch (err) {
      setError(getErrorMessage(err));
      form.setServerErrors(err);
      setSubmitting(false);
    }
  };
  const f = (name) => ({ name, value: form.values[name], onChange: form.handleChange, onBlur: form.handleBlur, error: form.errors[name] });

  return (
    <>
      <div className="hero hero-bleed owner-hero">
        <div className="hero-inner">
          <div className="hero-copy">
            <h1>Open your store</h1>
            <p>You do not have a store yet. Add it below with the same account; you can keep browsing and rating other stores as before.</p>
          </div>
          <ShopScene name={previewName} rating={null} />
        </div>
      </div>
      <div className="form-split">
        <section className="card" aria-labelledby="open-title">
          <h2 id="open-title" style={{ marginBottom: 16 }}>Store details</h2>
          <ErrorMessage message={error} />
          <form onSubmit={onSubmit} noValidate>
            <TextField label="Store name" required hint="Up to 60 characters" {...f('name')} />
            <TextField label="Store email" type="email" required {...f('email')} />
            <TextField label="Store address" as="textarea" required hint="Up to 400 characters" {...f('address')} />
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              <Store size={17} aria-hidden="true" /> {submitting ? 'Opening...' : 'Open my store'}
            </button>
          </form>
        </section>
        <aside className="side-note">
          <h3>How it works</h3>
          <ul>
            <li>One account, one store. Your store gets its own page here under My store.</li>
            <li>Other people rate it from Browse stores. You will see every rating and who gave it.</li>
            <li>You cannot rate your own store, but you can rate all the others.</li>
          </ul>
        </aside>
      </div>
    </>
  );
}
