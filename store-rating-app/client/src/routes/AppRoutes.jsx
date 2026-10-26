import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MEMBER_ROLES, homePathForRole } from '../utils/constants';
import ProtectedRoute from './ProtectedRoute';
import DashboardLayout from '../layouts/DashboardLayout';
import Loader from '../components/Loader';
import Login from '../pages/Login';
import Register from '../pages/Register';
import ChangePassword from '../pages/ChangePassword';
import AccessDenied from '../pages/AccessDenied';
import NotFound from '../pages/NotFound';
import AdminDashboard from '../pages/admin/AdminDashboard';
import UsersPage from '../pages/admin/UsersPage';
import AddUser from '../pages/admin/AddUser';
import UserDetails from '../pages/admin/UserDetails';
import StoresPage from '../pages/admin/StoresPage';
import AddStore from '../pages/admin/AddStore';
import UserDashboard from '../pages/user/UserDashboard';
import MyRatings from '../pages/user/MyRatings';
import OwnerDashboard from '../pages/owner/OwnerDashboard';

function Home() {
  const { user, loading } = useAuth();
  if (loading) return <Loader />;
  return <Navigate to={user ? homePathForRole(user.role) : '/login'} replace />;
}

// Logged-in people visiting /login or /register are sent to their own dashboard
function GuestOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Loader />;
  return user ? <Navigate to={homePathForRole(user.role)} replace /> : children;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
      <Route path="/register" element={<GuestOnly><Register /></GuestOnly>} />

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/change-password" element={<ChangePassword />} />
          <Route path="/access-denied" element={<AccessDenied />} />

          <Route element={<ProtectedRoute roles={['ADMIN']} />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<UsersPage />} />
            <Route path="/admin/users/new" element={<AddUser />} />
            <Route path="/admin/users/:id" element={<UserDetails />} />
            <Route path="/admin/stores" element={<StoresPage />} />
            <Route path="/admin/stores/new" element={<AddStore />} />
          </Route>

          {/* One account, both sides: every Normal User / Store Owner sees all three pages */}
          <Route element={<ProtectedRoute roles={MEMBER_ROLES} />}>
            <Route path="/stores" element={<UserDashboard />} />
            <Route path="/my-ratings" element={<MyRatings />} />
            <Route path="/owner" element={<OwnerDashboard />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
