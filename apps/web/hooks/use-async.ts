/**
 * Generic async operation hook. Replaces the pattern of:
 *   const [loading, setLoading] = useState(false);
 *   const [error, setError] = useState('');
 *   const run = async () => { setLoading(true); try {...} catch {...} finally {...} }
 *
 * Usage:
 *   const { run, loading, error } = useAsync(async () => api.plans.generate(id));
 */

import { useState, useCallback } from 'react';

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  run: (...args: unknown[]) => Promise<T | null>;
  reset: () => void;
}

export function useAsync<T>(fn: (...args: unknown[]) => Promise<T>): AsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async (...args: unknown[]): Promise<T | null> => {
      setLoading(true);
      setError(null);
      try {
        const result = await fn(...args);
        setData(result);
        return result;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'An error occurred';
        setError(msg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [fn],
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { data, loading, error, run, reset };
}
