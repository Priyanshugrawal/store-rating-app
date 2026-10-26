import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import TextField from '../../components/TextField';
import ErrorMessage from '../../components/ErrorMessage';
import Loader from '../../components/Loader';
import useForm from '../../hooks/useForm';
import { useToast } from '../../context/ToastContext';
import { availableOwners, createStore } from '../../services/adminService';
import { getErrorMessage } from '../../services/api';
import { colorForName } from '../../three/colors';
import { validateAddress, validateEmail, validateName } from '../../utils/validators';

const validate = (v) => ({
  name: validateName(v.name),
  email: validateEmail(v.email),
  address: validateAddress(v.address),
  ownerId: v.ownerId ? '' : 'Select a store owner',
});

export default function AddStore() {
  const toast = useToast();
  const navigate = useNavigate();
  const form = useForm({ name: '', email: '', address: '', ownerId: '' }, validate);
  const [owners, setOwners] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    availableOwners().then(({ data }) => setOwners(data)).catch((e) => { setError(getErrorMessage(e)); setOwners([]); });
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.validateAll()) return;
    setSubmitting(true);
    try {
      const v = form.values;
      await createStore({ name: v.name.trim(), email: v.email.trim(), address: v.address.trim(), ownerId: Number(v.ownerId) });
      toast.success('Store created');
      navigate('/admin/stores');
    } catch (err) {
      setError(getErrorMessage(err));
      form.setServerErrors(err);
    } finally {
      setSubmitting(false);
    }
  };
  const f = (name) => ({ name, value: form.values[name], onChange: form.handleChange, onBlur: form.handleBlur, error: form.errors[name] });

  return (
    <>
      <div className="page-head"><div><h1>Add store</h1><p className="muted">Pick any member account that has no store yet. They become its Store Owner and keep their shopper features.</p></div></div>
      <div className="form-split">
        <div className="card">
          <ErrorMessage message={error} />
          {owners === null ? <Loader /> : (
            <form onSubmit={onSubmit} noValidate>
              <TextField label="Store name" required hint="Up to 60 characters" {...f('name')} />
              <TextField label="Store email" type="email" required {...f('email')} />
              <TextField label="Store address" as="textarea" required hint="Up to 400 characters" {...f('address')} />
              <TextField label="Store owner" as="select" required {...f('ownerId')}>
                <option value="">Select a member...</option>
                {owners.map((o) => <option key={o.id} value={o.id}>{o.name} ({o.email})</option>)}
              </TextField>
              {owners.length === 0 && (
                <p className="alert alert-info">
                  Every member already has a store. <Link to="/admin/users/new">Create a new user</Link> first.
                </p>
              )}
              <div className="button-row">
                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Saving...' : 'Create store'}</button>
                <Link className="btn btn-secondary" to="/admin/stores">Cancel</Link>
              </div>
            </form>
          )}
        </div>
        <aside className="side-note">
          <h3>Preview</h3>
          <div className="scene"><div className="scene-canvas" style={{ display: 'grid', placeItems: 'center' }}>
            <span className="tile-mono" style={{ transform: 'none', color: colorForName(form.values.name || 'Store'), width: 96, height: 96, fontSize: '2.4rem' }}>{(form.values.name || 'S')[0].toUpperCase()}</span>
          </div></div>
          <ul>
            <li>The colour of the sign comes from the store name.</li>
            <li>The store appears in the 3D neighbourhood once it has a rating.</li>
          </ul>
        </aside>
      </div>
    </>
  );
}
