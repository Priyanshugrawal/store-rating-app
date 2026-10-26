export function KpiBand({ children, label = 'Summary' }) {
  return <section className="kpis" aria-label={label}>{children}</section>;
}

export function Kpi({ icon, label, value, note }) {
  return (
    <div className="kpi">
      <div className="kpi-label">{icon}{label}</div>
      <div className="kpi-value tnum">{value}</div>
      {note && <div className="kpi-note">{note}</div>}
    </div>
  );
}
