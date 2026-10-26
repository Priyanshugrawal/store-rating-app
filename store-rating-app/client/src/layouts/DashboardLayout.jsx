import { Outlet, useLocation } from 'react-router-dom';
import Topbar from '../components/Topbar';

// Pages that open with a full-width hero have no top padding in <main>.
const HERO_PATHS = ['/admin', '/stores', '/owner'];

export default function DashboardLayout() {
  const { pathname } = useLocation();
  return (
    <div className="shell">
      <a href="#main" className="skip-link">Skip to content</a>
      <Topbar />
      <main id="main" className={`main ${HERO_PATHS.includes(pathname) ? 'wide' : ''}`} tabIndex={-1}>
        <Outlet />
      </main>
    </div>
  );
}
