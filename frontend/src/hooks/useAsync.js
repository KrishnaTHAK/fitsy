import { useCallback, useState } from 'react';

/**
 * Generic async hook for calling any async function from a component.
 *
 * Usage:
 *   const { data, loading, error, run } = useAsync(myAsyncFn);
 *   // Trigger manually:
 *   await run(arg1, arg2);
 *
 * @param {Function} asyncFn - The async function to wrap. Must return a value.
 * @returns {{ data: any, loading: boolean, error: string|null, run: Function }}
 */
export function useAsync(asyncFn) {
  const [state, setState] = useState({
    data: null,
    loading: false,
    error: null,
  });

  const run = useCallback(
    async (...args) => {
      setState({ data: null, loading: true, error: null });
      try {
        const data = await asyncFn(...args);
        setState({ data, loading: false, error: null });
        return data;
      } catch (err) {
        const error = err?.message || 'Something went wrong';
        setState({ data: null, loading: false, error });
        return null;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [asyncFn],
  );

  return { ...state, run };
}
