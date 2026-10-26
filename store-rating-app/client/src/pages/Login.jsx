import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import TextField from '../components/TextField';
import ErrorMessage from '../components/ErrorMessage';
import useForm from '../hooks/useForm';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../services/api';
import { homePathForRole } from '../utils/constants';

const validate = (v) => ({
  email: v.email.trim() ? '' : 'Email is required',
  password: v.password ? '' : 'Password is required',
});

export default function Login() {
  const { login, sessionMessage } = useAuth();
  const navigate = useNavigate();
  const form = useForm({ email: '', password: '' }, validate);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.validateAll()) return;
    setSubmitting(true);
    try {
      const user = await login({ email: form.values.email.trim(), password: form.values.password });
      navigate(homePathForRole(user.role), { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
      form.setServerErrors(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to rate stores or manage the platform."
      footer={<>New here? <Link to="/register">Create an account</Link></>}
    >
      {sessionMessage && <div className="alert alert-info" role="status">{sessionMessage}</div>}
      <ErrorMessage message={error} />
      <form onSubmit={onSubmit} noValidate>
        <TextField label="Email" name="email" type="email" autoComplete="email" required
          value={form.values.email} onChange={form.handleChange} onBlur={form.handleBlur} error={form.errors.email} />
        <TextField label="Password" name="password" type="password" autoComplete="current-password" required
          value={form.values.password} onChange={form.handleChange} onBlur={form.handleBlur} error={form.errors.password} />
        <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
          {submitting ? 'Logging in...' : 'Log in'}
        </button>
      </form>
    </AuthLayout>
  );
}
