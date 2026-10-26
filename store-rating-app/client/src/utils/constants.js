export const ROLE_LABELS = { ADMIN: 'System Administrator', USER: 'Normal User', OWNER: 'Store Owner' };

export const ROLE_OPTIONS = [
  { value: 'USER', label: 'Normal User' },
  { value: 'OWNER', label: 'Store Owner' },
  { value: 'ADMIN', label: 'System Administrator' },
];

export const RATING_LABELS = { 1: 'Very Poor', 2: 'Poor', 3: 'Average', 4: 'Good', 5: 'Excellent' };

export const homePathForRole = (role) =>
  ({ ADMIN: '/admin', USER: '/stores', OWNER: '/stores' }[role] || '/login');

// Normal Users and Store Owners share one account experience: browse, rate, and "My store".
export const MEMBER_ROLES = ['USER', 'OWNER'];
