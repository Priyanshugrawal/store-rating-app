import { colorForName } from '../three/colors';

export const initials = (name = '') =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('') || '?';

export default function Avatar({ name, size = '' }) {
  return (
    <span className={`avatar ${size === 'lg' ? 'avatar-lg' : ''}`} style={{ background: colorForName(name || '?') }} aria-hidden="true">
      {initials(name)}
    </span>
  );
}

/** Square letter badge for a store; colour matches the shop in the 3D scene. */
export function Monogram({ name }) {
  return <span className="monogram" style={{ background: colorForName(name) }} aria-hidden="true">{(name || '?')[0].toUpperCase()}</span>;
}
