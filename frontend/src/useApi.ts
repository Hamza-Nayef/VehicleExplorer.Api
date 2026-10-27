import { useEffect, useState } from 'react';

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

const IDLE = { data: null, loading: false, error: null } as const;

/**
 * Loads data whenever `key` changes. `key` must encode every input `load` uses
 * (that is what makes it safe to read the latest `load` without listing it as a dependency).
 * Pass `null` to stay idle, e.g. until the user has picked a make.
 *
 * - Stale responses can never overwrite newer ones: the previous request is aborted.
 * - `retry()` re-runs the same request after a failure.
 */
export function useApi<T>(key: string | null, load: (signal: AbortSignal) => Promise<T>) {
  const [state, setState] = useState<ApiState<T>>(IDLE);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (key === null) {
      setState(IDLE);
      return;
    }

    const controller = new AbortController();
    setState({ data: null, loading: true, error: null });

    load(controller.signal)
      .then((data) => setState({ data, loading: false, error: null }))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return; // superseded or unmounted - not an error
        setState({
          data: null,
          loading: false,
          error: err instanceof Error ? err.message : 'Something went wrong. Please try again.',
        });
      });

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `key` stands in for `load`'s inputs
  }, [key, attempt]);

  return { ...state, retry: () => setAttempt((n) => n + 1) };
}
