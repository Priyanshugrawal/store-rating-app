import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import TextField, { PasswordRules } from '../../components/TextField';
import ErrorMessage from '../../components/ErrorMessage';
import useForm from '../../hooks/useForm';
import { useToast } from '../../context/ToastContext';
import { createUser } from '../../services/adminService';
import { getErrorMessage } from '../../services/api';
import { ROLE_OPTIONS } from '../../utils/constants';
import { validateAddress, validateEmail, validateName, validatePassword } from '../../utils/validators';

const validate = (v) => ({
  name: validateName(v.name),
  email: validateEmail(v.email),
  address: validateAddress(v.address),
  password: validatePassword(v.password),
  role: v.role ? '' : 'Select a role',
});

export default function AddUser() {
  const toast = useToast();
  const navigate = useNavigate();
  const form = useForm({ name: '', email: '', address: '', password: '', role: 'USER' }, validate);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.validateAll()) return;
    setSubmitting(true);
    try {
      const v = form.values;
      const { data } = await createUser({ ...v, name: v.name.trim(), email: v.email.trim(), address: v.address.trim() });
      toast.success(`${data.name} was created`);
      navigate(`/admin/users/${data.id}`);
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
      <div className="page-head"><div><h1>Add user</h1><p className="muted">Create an account for a shopper, a store owner or another administrator.</p></div></div>
      <div className="form-split">
        <div className="card">
          <ErrorMessage message={error} />
          <form onSubmit={onSubmit} noValidate>
            <TextField label="Full name" required hint="Up to 60 characters" {...f('name')} />
            <TextField label="Email" type="email" required {...f('email')} />
            <TextField label="Address" as="textarea" required hint="Up to 400 characters" {...f('address')} />
            <TextField label="Password" type="password" required autoComplete="new-password" {...f('password')} />
            <PasswordRules value={form.values.password} />
            <div style={{ height: 16 }} />
            <TextField label="Role" as="select" required {...f('role')}>
              {ROLE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </TextField>
            {form.values.role === 'OWNER' && (
              <p className="alert alert-info">Give them a store from <Link to="/admin/stores/new">Add store</Link>, or they can open one themselves from My store.</p>
            )}
            <div className="button-row">
              <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Saving...' : 'Create user'}</button>
              <Link className="btn btn-secondary" to="/admin/users">Cancel</Link>
            </div>
          </form>
        </div>
        <aside className="side-note">
          <h3>Which role?</h3>
          <ul>
            <li><strong>Normal User</strong> browses and rates stores, and can open their own store later from My store.</li>
            <li><strong>Store Owner</strong> does all of that and manages one store with the same login.</li>
            <li><strong>System Administrator</strong> manages users and stores.</li>
          </ul>
        </aside>
      </div>
    </>
  );
}
