import { useCallback, useEffect, useState } from 'react';
import api, { errorMessage } from './api';

// Loads data from an endpoint and re-fetches when the url changes. Returns { data, loading, error, reload }.
export function useFetch(url) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const load = useCallback(async () => {
    if (!url) return;
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const { data } = await api.get(url);
      setState({ data, loading: false, error: null });
    } catch (e) {
      setState({ data: null, loading: false, error: errorMessage(e) });
    }
  }, [url]);
  useEffect(() => { load(); }, [load]);
  return { ...state, reload: load };
}

export const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-');
export const fmtTime = (d) => (d ? new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '-');
