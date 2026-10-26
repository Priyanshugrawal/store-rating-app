// Client-side validation. These rules mirror the server (which re-checks everything).
export const validateName = (v = '') => {
  const s = v.trim();
  if (!s) return 'Name is required';

  if (s.length > 60) return 'Name must be at most 60 characters';
  return '';
};

export const validateEmail = (v = '') => {
  const s = v.trim();
  if (!s) return 'Email is required';
  if (s.length > 255) return 'Email must be at most 255 characters';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s)) return 'Enter a valid email address';
  return '';
};

export const validateAddress = (v = '') => {
  const s = v.trim();
  if (!s) return 'Address is required';
  if (s.length > 400) return 'Address must be at most 400 characters';
  return '';
};

export const validatePassword = (v = '') => {
  if (!v) return 'Password is required';
  if (v.length < 8) return 'Password must be at least 8 characters';
  if (v.length > 16) return 'Password must be at most 16 characters';
  if (!/[A-Z]/.test(v)) return 'Password must contain at least one uppercase letter';
  if (!/[^A-Za-z0-9]/.test(v)) return 'Password must contain at least one special character';
  return '';
};

export const validateConfirm = (password, confirm) => {
  if (!confirm) return 'Please confirm your password';
  if (password !== confirm) return 'Passwords do not match';
  return '';
};

export const validateRating = (v) => {
  const n = Number(v);
  if (!Number.isInteger(n) || n < 1 || n > 5) return 'Choose a rating from 1 to 5';
  return '';
};

/** Removes empty-string entries so `Object.keys(errors).length === 0` means "valid". */
export const compact = (errors) =>
  Object.fromEntries(Object.entries(errors).filter(([, message]) => message));
