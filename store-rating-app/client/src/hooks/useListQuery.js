import { useCallback, useEffect, useRef, useState } from 'react';
import useDebounce from './useDebounce';
import { getErrorMessage } from '../services/api';

const clean = (params) =>
  Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v !== undefined && v !== null));

/**
 * Handles searching, filtering, sorting and pagination for any list endpoint.
 * `fetcher(params)` must return a promise of { data, meta }.
 */
export default function useListQuery(fetcher, initialParams) {
  const [params, setParams] = useState({ page: 1, limit: 10, order: 'asc', ...initialParams });
  const [state, setState] = useState({ items: [], meta: null, loading: true, error: '' });
  const [reloadKey, setReloadKey] = useState(0);
  const debounced = useDebounce(params, 350);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: '' }));
    fetcherRef
      .current(clean(debounced))
      .then(({ data, meta }) => {
        if (!cancelled) setState({ items: data, meta, loading: false, error: '' });
      })
      .catch((err) => {
        if (!cancelled) setState((s) => ({ ...s, loading: false, error: getErrorMessage(err) }));
      });
    return () => {
      cancelled = true;
    };
  }, [debounced, reloadKey]);

  const setFilter = useCallback((name, value) => setParams((p) => ({ ...p, [name]: value, page: 1 })), []);
  const setPage = useCallback((page) => setParams((p) => ({ ...p, page })), []);
  const toggleSort = useCallback(
    (column) =>
      setParams((p) => ({
        ...p,
        sortBy: column,
        order: p.sortBy === column && p.order === 'asc' ? 'desc' : 'asc',
        page: 1,
      })),
    []
  );
  const reload = useCallback(() => setReloadKey((k) => k + 1), []);
  const reset = useCallback(() => setParams({ page: 1, limit: 10, order: 'asc', ...initialParams }), [initialParams]);

  return { params, ...state, setFilter, setPage, toggleSort, reload, reset };
}
