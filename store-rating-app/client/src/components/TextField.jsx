import { useState } from 'react';
import { Check, Circle, Eye, EyeOff } from 'lucide-react';

// Label + input + error message wired together for accessibility.
export default function TextField({ label, name, error, hint, as = 'input', children, ...props }) {
  const [show, setShow] = useState(false);
  const isPassword = props.type === 'password';
  const describedBy = [error ? `${name}-error` : null, hint ? `${name}-hint` : null].filter(Boolean).join(' ') || undefined;
  const common = { id: name, name, 'aria-invalid': error ? 'true' : 'false', 'aria-describedby': describedBy, ...props };
  let control;
  if (as === 'textarea') control = <textarea rows={3} {...common} />;
  else if (as === 'select') control = <select {...common}>{children}</select>;
  else if (isPassword) {
    control = (
      <div className="pw-wrap">
        <input {...common} type={show ? 'text' : 'password'} />
        <button type="button" className="pw-toggle" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'} aria-pressed={show}>
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    );
  } else control = <input {...common} />;
  return (
    <div className={`form-field ${error ? 'has-error' : ''}`}>
      <label htmlFor={name}>
        {label}
        {props.required && <span className="required" aria-hidden="true"> *</span>}
      </label>
      {control}
      {hint && !error && <p id={`${name}-hint`} className="field-hint">{hint}</p>}
      {error && <p id={`${name}-error`} className="field-error" role="alert">{error}</p>}
    </div>
  );
}

/** Live checklist that ticks off the password rules as the person types. */
export function PasswordRules({ value = '' }) {
  const rules = [
    ['8 to 16 characters', value.length >= 8 && value.length <= 16],
    ['One uppercase letter', /[A-Z]/.test(value)],
    ['One special character', /[^A-Za-z0-9]/.test(value)],
  ];
  return (
    <ul className="rules" aria-label="Password rules">
      {rules.map(([text, ok]) => (
        <li key={text} className={ok ? 'ok' : ''}>
          {ok ? <Check size={15} aria-hidden="true" /> : <Circle size={15} aria-hidden="true" />}
          <span>{text}{ok ? ' (done)' : ''}</span>
        </li>
      ))}
    </ul>
  );
}
