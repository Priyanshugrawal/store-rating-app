import { Brand } from '../components/Topbar';
import ThemeToggle from '../components/ThemeToggle';
import { CityScene } from '../components/Scene';
import { DEMO_SKYLINE } from '../utils/demoSkyline';

export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="auth">
      <aside className="auth-art">
        <Brand to="/login" />
        <CityScene buildings={DEMO_SKYLINE} parallax label="Decorative 3D neighbourhood of shops" />
        <div className="auth-art-copy">
          <h2>Every shop on your street, rated by the people who shop there.</h2>
          <p>Give a score from 1 to 5 and watch the neighbourhood grow taller for the stores that deserve it.</p>
        </div>
      </aside>
      <main className="auth-panel" id="main">
        <div className="auth-theme"><ThemeToggle /></div>
        <div className="auth-form">
          <div className="mobile-brand"><Brand to="/login" /></div>
          <h1>{title}</h1>
          {subtitle && <p className="lead">{subtitle}</p>}
          {children}
          {footer && <p className="auth-footer">{footer}</p>}
        </div>
      </main>
    </div>
  );
}
