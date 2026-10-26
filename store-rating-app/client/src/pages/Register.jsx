import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import TextField, { PasswordRules } from '../components/TextField';
import ErrorMessage from '../components/ErrorMessage';
import useForm from '../hooks/useForm';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../services/api';
import { homePathForRole } from '../utils/constants';
import { validateAddress, validateConfirm, validateEmail, validateName, validatePassword } from '../utils/validators';

const validate = (v) => ({
  name: validateName(v.name),
  email: validateEmail(v.email),
  address: validateAddress(v.address),
  password: validatePassword(v.password),
  confirmPassword: validateConfirm(v.password, v.confirmPassword),
});

export default function Register() {
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const form = useForm({ name: '', email: '', address: '', password: '', confirmPassword: '' }, validate);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.validateAll()) return;
    setSubmitting(true);
    try {
      const { name, email, address, password, confirmPassword } = form.values;
      const user = await register({ name: name.trim(), email: email.trim(), address: address.trim(), password, confirmPassword });
      toast.success('Account created. Welcome!');
      navigate(homePathForRole(user.role), { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
      form.setServerErrors(err);
    } finally {
      setSubmitting(false);
    }
  };

  const f = (name) => ({ name, value: form.values[name], onChange: form.handleChange, onBlur: form.handleBlur, error: form.errors[name] });

  return (
    <AuthLayout title="Create your account" subtitle="One account to rate the shops you visit and, if you run one, to open your own store."
      footer={<>Already registered? <Link to="/login">Log in</Link></>}>
      <ErrorMessage message={error} />
      <form onSubmit={onSubmit} noValidate>
        <TextField label="Full name" required autoComplete="name" hint="Up to 60 characters" {...f('name')} />
        <TextField label="Email" type="email" required autoComplete="email" {...f('email')} />
        <TextField label="Address" as="textarea" required autoComplete="street-address" hint="Up to 400 characters" {...f('address')} />
        <TextField label="Password" type="password" required autoComplete="new-password" {...f('password')} />
        <PasswordRules value={form.values.password} />
        <div style={{ height: 16 }} />
        <TextField label="Confirm password" type="password" required autoComplete="new-password" {...f('confirmPassword')} />
        <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
          {submitting ? 'Creating account...' : 'Sign up'}
        </button>
      </form>
    </AuthLayout>
  );
}
