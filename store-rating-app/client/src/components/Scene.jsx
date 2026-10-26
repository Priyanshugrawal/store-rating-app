import { useEffect, useRef, useState } from 'react';
import { colorForName } from '../three/colors';

// The Three.js code is loaded on demand, so pages that do not show a scene never download it.
const loadScenes = () => import('../three/city.js');

function Fallback({ buildings }) {
  const list = (buildings || []).slice(0, 14);
  return (
    <div className="scene-fallback" aria-hidden="true">
      {list.map((b) => (
        <span key={b.name} style={{ height: `${28 + (b.rating ?? 2) * 15}%`, background: colorForName(b.name) }} />
      ))}
    </div>
  );
}

/** 3D neighbourhood: one building per store, taller = better rated. */
export function CityScene({ buildings, interactive = true, parallax = false, className = '', label }) {
  const host = useRef(null);
  const [tip, setTip] = useState(null);
  const [failed, setFailed] = useState(false);
  const key = (buildings || []).map((b) => `${b.name}:${b.rating}`).join('|');

  useEffect(() => {
    if (!buildings || buildings.length === 0) return undefined;
    let scene = null;
    let cancelled = false;
    loadScenes()
      .then((m) => {
        if (cancelled || !host.current) return;
        scene = m.createCityScene(host.current, buildings, { interactive, parallax, onHover: setTip });
        if (!scene) setFailed(true);
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
      setTip(null);
      scene?.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, interactive, parallax]);

  return (
    <div className={`scene ${className}`}>
      <div ref={host} className="scene-canvas" role="img" aria-label={label || 'Miniature neighbourhood where each shop stands as tall as its rating'} />
      {failed && <Fallback buildings={buildings} />}
      {tip && (
        <div className="scene-tip" style={{ left: tip.x, top: tip.y }}>
          <strong>{tip.name}</strong>
          <span>{tip.rating == null ? 'No ratings yet' : `${tip.rating.toFixed(1)} from ${tip.count} ${tip.count === 1 ? 'rating' : 'ratings'}`}</span>
        </div>
      )}
    </div>
  );
}

/** A single shop with five stars orbiting it; the stars that are lit match the rating. */
export function ShopScene({ name, rating, className = '' }) {
  const host = useRef(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let scene = null;
    let cancelled = false;
    loadScenes()
      .then((m) => {
        if (cancelled || !host.current) return;
        scene = m.createShopScene(host.current, { name, rating });
        if (!scene) setFailed(true);
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
      scene?.dispose();
    };
  }, [name, rating]);
  return (
    <div className={`scene ${className}`}>
      <div ref={host} className="scene-canvas" role="img" aria-label={`${name}: ${rating == null ? 'no ratings yet' : `${rating.toFixed(1)} out of 5`}`} />
      {failed && <Fallback buildings={[{ name, rating }]} />}
    </div>
  );
}
