import { useState } from 'react';
import TextField, { PasswordRules } from '../components/TextField';
import ErrorMessage from '../components/ErrorMessage';
import useForm from '../hooks/useForm';
import { useToast } from '../context/ToastContext';
import * as authService from '../services/authService';
import { getErrorMessage } from '../services/api';
import { validateConfirm, validatePassword } from '../utils/validators';

const validate = (v) => ({
  currentPassword: v.currentPassword ? '' : 'Current password is required',
  newPassword: validatePassword(v.newPassword),
  confirmPassword: validateConfirm(v.newPassword, v.confirmPassword),
});

export default function ChangePassword() {
  const toast = useToast();
  const form = useForm({ currentPassword: '', newPassword: '', confirmPassword: '' }, validate);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.validateAll()) return;
    setSubmitting(true);
    try {
      await authService.changePassword(form.values);
      toast.success('Password changed successfully');
      form.reset();
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
      <div className="page-head"><div><h1>Change password</h1><p className="muted">Pick something you do not use anywhere else.</p></div></div>
      <div className="card" style={{ maxWidth: 520 }}>
        <ErrorMessage message={error} />
        <form onSubmit={onSubmit} noValidate>
          <TextField label="Current password" type="password" required autoComplete="current-password" {...f('currentPassword')} />
          <TextField label="New password" type="password" required autoComplete="new-password" {...f('newPassword')} />
          <PasswordRules value={form.values.newPassword} />
          <div style={{ height: 16 }} />
          <TextField label="Confirm new password" type="password" required autoComplete="new-password" {...f('confirmPassword')} />
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Saving...' : 'Update password'}
          </button>
        </form>
      </div>
    </>
  );
}
