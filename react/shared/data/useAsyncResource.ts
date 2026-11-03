import { useCallback, useEffect, useMemo, useState } from "react";

export type FetchState<T> =
  { status: "loading" } | { status: "error"; message: string } | { status: "ready"; data: T };

export interface FetchResult<T> {
  state: FetchState<T>;
  // Number of the current attempt (1 for the first request, +1 per reload).
  attempt: number;
  reload: () => void;
}

// Runs `load` and tracks loading / error / ready. It knows nothing about URLs
// or fetch: that is the API layer's job. It re-runs when `loadKey` changes or
// reload() is called, and cancels the previous request first
// (Demo 7), so a slow older answer can never overwrite a newer one.
// A hook, not a plain function, because it uses useState and useEffect: it
// has state of its own per component that calls it.
export function useAsyncResource<T>(
  load: (signal: AbortSignal) => Promise<T>,
  loadKey: string,
): FetchResult<T> {
  const [state, setState] = useState<FetchState<T>>({ status: "loading" });
  const [attempt, setAttempt] = useState(1);

  useEffect(() => {
    setState({ status: "loading" });
    const controller = new AbortController();
    load(controller.signal).then(
      (data) => {
        if (controller.signal.aborted) return;
        setState({ status: "ready", data });
      },
      (error: unknown) => {
        if (controller.signal.aborted) return;
        const reason = error instanceof Error ? error.message : String(error);
        setState({ status: "error", message: reason });
      },
    );
    return () => controller.abort();
    // `load` is deliberately not a dependency: it is a new function every
    // render. `loadKey` stands for everything `load` depends on.
  }, [loadKey, attempt]);

  const reload = useCallback(() => setAttempt((previous) => previous + 1), []);

  return useMemo(() => ({ state, attempt, reload }), [state, attempt, reload]);
}
