import { useState } from 'react';
import { Star } from 'lucide-react';
import { RATING_LABELS } from '../utils/constants';

const shortDay = (iso) => new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

/** Area chart of ratings per day, with hover read-out and a hidden data table for screen readers. */
export function AreaChart({ points, unit = 'ratings' }) {
  const [hover, setHover] = useState(null);
  const W = 640, H = 220, L = 34, R = 10, T = 14, B = 26;
  const max = Math.max(4, ...points.map((p) => p.count));
  const niceMax = Math.ceil(max / 4) * 4;
  const x = (i) => L + (i * (W - L - R)) / Math.max(1, points.length - 1);
  const y = (v) => T + (1 - v / niceMax) * (H - T - B);
  const line = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.count).toFixed(1)}`).join(' ');
  const area = `${line} L${x(points.length - 1)},${H - B} L${x(0)},${H - B} Z`;
  const ticks = [0, 1, 2, 3, 4].map((t) => (niceMax / 4) * t);

  const onMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const i = Math.round(((px - L) / (W - L - R)) * (points.length - 1));
    setHover(Math.min(points.length - 1, Math.max(0, i)));
  };
  const h = hover == null ? null : points[hover];

  return (
    <div className="chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Line chart of ${unit} per day for the last ${points.length} days`}
        onPointerMove={onMove} onPointerLeave={() => setHover(null)}>
        {ticks.map((t) => (
          <g key={t}>
            <line className="grid-line" x1={L} x2={W - R} y1={y(t)} y2={y(t)} />
            <text x={L - 8} y={y(t) + 4} textAnchor="end">{t}</text>
          </g>
        ))}
        <path className="area" d={area} />
        <path className="line" d={line} />
        {[0, Math.floor(points.length / 2), points.length - 1].map((i) => (
          <text key={i} x={x(i)} y={H - 6} textAnchor={i === 0 ? 'start' : i === points.length - 1 ? 'end' : 'middle'}>{shortDay(points[i].date)}</text>
        ))}
        {h && (
          <g>
            <line className="cross" x1={x(hover)} x2={x(hover)} y1={T} y2={H - B} />
            <circle className="dot" cx={x(hover)} cy={y(h.count)} r="5" />
          </g>
        )}
      </svg>
      {h && (
        <div className="chart-tip" style={{ left: `${(x(hover) / W) * 100}%`, top: `${(y(h.count) / H) * 100}%` }}>
          <strong>{h.count}</strong> {unit} on {shortDay(h.date)}
        </div>
      )}
      <table className="sr-only">
        <caption>Ratings per day</caption>
        <thead><tr><th>Day</th><th>Ratings</th></tr></thead>
        <tbody>{points.map((p) => <tr key={p.date}><td>{p.date}</td><td>{p.count}</td></tr>)}</tbody>
      </table>
    </div>
  );
}

/** Horizontal bars for the 1-5 star distribution. */
export function Distribution({ distribution }) {
  const total = [1, 2, 3, 4, 5].reduce((s, n) => s + (distribution[n] || 0), 0);
  return (
    <div>
      {[5, 4, 3, 2, 1].map((n) => {
        const count = distribution[n] || 0;
        return (
          <div className="dist-row" key={n}>
            <span className="dist-label">{n}<Star size={14} fill="currentColor" strokeWidth={0} aria-hidden="true" /></span>
            <div className="dist-track" role="img" aria-label={`${count} ratings of ${n} (${RATING_LABELS[n]})`}>
              <div className="dist-fill" style={{ width: total ? `${(count / total) * 100}%` : '0%' }} />
            </div>
            <span className="dist-count">{count}</span>
          </div>
        );
      })}
    </div>
  );
}
