// A row of filter inputs. fields: [{ name, label, type: 'text' | 'select', options? }]
export default function FilterControls({ fields, values, onChange, onReset }) {
  return (
    <form className="filters" role="search" onSubmit={(e) => e.preventDefault()} aria-label="Filters">
      {fields.map((f) => (
        <div className="filter-item" key={f.name}>
          <label htmlFor={`filter-${f.name}`}>{f.label}</label>
          {f.type === 'select' ? (
            <select id={`filter-${f.name}`} value={values[f.name] || ''} onChange={(e) => onChange(f.name, e.target.value)}>
              <option value="">All</option>
              {f.options.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          ) : (
            <input
              id={`filter-${f.name}`}
              type="text"
              value={values[f.name] || ''}
              placeholder={`Filter by ${f.label.toLowerCase()}`}
              onChange={(e) => onChange(f.name, e.target.value)}
            />
          )}
        </div>
      ))}
      <button type="button" className="btn btn-secondary btn-small" onClick={onReset}>Clear filters</button>
    </form>
  );
}
