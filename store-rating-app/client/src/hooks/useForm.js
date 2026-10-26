import { useCallback, useState } from 'react';
import { compact } from '../utils/validators';
import { getFieldErrors } from '../services/api';

/**
 * Tiny form helper.
 * validate(values) -> { field: 'message' | '' }
 */
export default function useForm(initialValues, validate) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});

  const setField = useCallback(
    (name, value) => {
      setValues((v) => {
        const next = { ...v, [name]: value };
        // re-validate a field that is already showing an error (or its confirm partner)
        setErrors((e) => {
          if (!Object.keys(e).length) return e;
          const all = compact(validate(next));
          const updated = { ...e };
          for (const key of Object.keys(e)) {
            if (all[key]) updated[key] = all[key];
            else delete updated[key];
          }
          return updated;
        });
        return next;
      });
    },
    [validate]
  );

  const handleChange = (e) => setField(e.target.name, e.target.value);

  const handleBlur = (e) => {
    const { name } = e.target;
    // Focus is moving to the submit button: the submit validates every field anyway, and showing
    // a message now would shift the layout under the pointer so the click could miss the button.
    if (e.relatedTarget && e.relatedTarget.type === 'submit') return;
    const message = validate(values)[name];
    setErrors((prev) => {
      const next = { ...prev };
      if (message) next[name] = message;
      else delete next[name];
      return next;
    });
  };

  /** Returns true when valid; otherwise shows all errors. */
  const validateAll = () => {
    const found = compact(validate(values));
    setErrors(found);
    if (Object.keys(found).length) {
      // move focus to the first invalid field for keyboard / screen reader users
      const first = document.getElementById(Object.keys(found)[0]);
      if (first) first.focus();
    }
    return Object.keys(found).length === 0;
  };

  const setServerErrors = (error) => setErrors((e) => ({ ...e, ...getFieldErrors(error) }));
  const reset = () => {
    setValues(initialValues);
    setErrors({});
  };

  return { values, errors, setField, handleChange, handleBlur, validateAll, setServerErrors, reset, setErrors };
}
