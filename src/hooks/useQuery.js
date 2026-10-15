import { useCallback, useEffect, useState } from 'react';

/**
 * Tiny data-fetching hook. `fetcher` must be referentially stable (wrap it in
 * useCallback); changing it triggers a fresh load and shows the loading state.
 */
export function useQuery(fetcher) {
  const [state, setState] = useState({ data: null, error: null, source: null });
  const [tick, setTick] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetcher()
      .then((data) => {
        if (!cancelled) setState({ data, error: null, source: fetcher });
      })
      .catch((error) => {
        if (!cancelled) setState((s) => ({ data: s.data, error, source: fetcher }));
      })
      .finally(() => {
        if (!cancelled) setRefreshing(false);
      });
    return () => {
      cancelled = true;
    };
  }, [fetcher, tick]);

  const reload = useCallback(() => {
    setRefreshing(true);
    setTick((t) => t + 1);
  }, []);

  const setData = useCallback((updater) => {
    setState((s) => ({ ...s, data: typeof updater === 'function' ? updater(s.data) : updater }));
  }, []);

  return {
    data: state.data,
    error: state.error,
    loading: state.source !== fetcher,
    refreshing,
    reload,
    setData,
  };
}
