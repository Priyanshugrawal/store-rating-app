import { Link } from 'react-router-dom';
import { CityScene } from '../components/Scene';
import { DEMO_SKYLINE } from '../utils/demoSkyline';

export default function NotFound() {
  return (
    <main className="center-page" id="main">
      <div>
        <div style={{ background: 'var(--ink)', borderRadius: 24, maxWidth: 460, margin: '0 auto' }}>
          <CityScene buildings={DEMO_SKYLINE.slice(0, 6)} interactive={false} label="Decorative 3D shops" className="" />
        </div>
        <h1>That street does not exist</h1>
        <p className="muted">The page you are looking for is not here. It may have moved.</p>
        <p style={{ marginTop: 18 }}><Link className="btn btn-primary" to="/">Back to home</Link></p>
      </div>
    </main>
  );
}
