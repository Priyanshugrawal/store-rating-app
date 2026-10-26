import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { ChevronDown, KeyRound, LogOut, Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ROLE_LABELS, homePathForRole } from '../utils/constants';
import Avatar from './Avatar';
import ConfirmDialog from './ConfirmDialog';
import ThemeToggle from './ThemeToggle';

const TABS = {
  ADMIN: [
    { to: '/admin', label: 'Overview', end: true },
    { to: '/admin/users', label: 'Users', exceptNew: true },
    { to: '/admin/stores', label: 'Stores', exceptNew: true },
    { to: '/admin/users/new', label: 'Add user' },
    { to: '/admin/stores/new', label: 'Add store' },
  ],
};
// Normal Users and Store Owners get the same tabs: shopping side and store side together.
TABS.USER = [
  { to: '/stores', label: 'Browse stores', end: true },
  { to: '/my-ratings', label: 'My ratings' },
  { to: '/owner', label: 'My store', end: true },
];
TABS.OWNER = TABS.USER;

export function Brand({ to = '/' }) {
  return (
    <Link to={to} className="brand">
      <span className="brand-mark" aria-hidden="true"><Star size={18} fill="currentColor" strokeWidth={0} /></span>
      Shopfront
    </Link>
  );
}

export default function Topbar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const wrap = useRef(null);
  const { pathname } = useLocation();

  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => { if (!wrap.current?.contains(e.target)) setOpen(false); };
    const esc = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Brand to={homePathForRole(user.role)} />
        <nav className="tabs" aria-label="Main navigation">
          {(TABS[user.role] || []).map((t) => (
            <NavLink key={t.to} to={t.to} end={t.end} className={({ isActive }) => (isActive && !(t.exceptNew && pathname.endsWith('/new')) ? 'tab active' : 'tab')}>{t.label}</NavLink>
          ))}
        </nav>
        <div className="topbar-right">
          <ThemeToggle />
          <div className="menu-wrap" ref={wrap}>
            <button type="button" className="avatar-btn" aria-haspopup="menu" aria-expanded={open} aria-label="Account menu" onClick={() => setOpen((o) => !o)}>
              <Avatar name={user.name} />
              <span className="who"><strong>{user.name}</strong><span>{ROLE_LABELS[user.role]}</span></span>
              <ChevronDown size={16} aria-hidden="true" />
            </button>
            {open && (
              <div className="menu" role="menu">
                <div className="menu-head"><strong>{user.name}</strong><span>{user.email}</span></div>
                <Link to="/change-password" role="menuitem" onClick={() => setOpen(false)}><KeyRound size={16} aria-hidden="true" /> Change password</Link>
                <button type="button" role="menuitem" onClick={() => { setOpen(false); setConfirming(true); }}><LogOut size={16} aria-hidden="true" /> Log out</button>
              </div>
            )}
          </div>
        </div>
      </div>
      <ConfirmDialog open={confirming} title="Log out?" message="You will need to log in again to continue." confirmLabel="Log out" onConfirm={logout} onCancel={() => setConfirming(false)} />
    </header>
  );
}
