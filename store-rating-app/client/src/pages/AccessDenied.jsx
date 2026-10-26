import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { homePathForRole } from '../utils/constants';
import EmptyState from '../components/EmptyState';

export default function AccessDenied() {
  const { user } = useAuth();
  return (
    <div className="card">
      <EmptyState icon={<ShieldAlert size={26} />} title="This page is not for your account" message="Your role does not include this area. Head back to your own pages.">
        <Link className="btn btn-primary" to={user ? homePathForRole(user.role) : '/login'}>Go to my home</Link>
      </EmptyState>
    </div>
  );
}
