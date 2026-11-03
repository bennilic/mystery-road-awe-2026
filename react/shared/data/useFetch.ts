import { useCallback, useEffect, useMemo, useState } from "react";

export type FetchState<T> =
  { status: "loading" } | { status: "error"; message: string } | { status: "ready"; data: T };

export interface FetchResult<T> {
  state: FetchState<T>;
  // Number of the current attempt (1 for the first request, +1 per reload).
  attempt: number;
  reload: () => void;
}

async function fetchJson<T>(url: string, signal: AbortSignal): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, { signal });
  } catch (error) {
    // An abort is not a failure to report: the caller cancelled on purpose.
    if (signal.aborted) throw error;
    // fetch only rejects when no HTTP answer arrived at all (server down, network cut).
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`${url} could not be reached (${reason})`);
  }
  if (!response.ok) {
    throw new Error(`${url} answered HTTP ${response.status} ${response.statusText}`);
  }
  return (await response.json()) as T;
}

// Loads `url` as JSON and tracks loading / error / ready. It re-runs when the
// url changes or reload() is called, and cancels the previous request first
// (Demo 7), so a slow older answer can never overwrite a newer one.
// A hook, not a plain function, because it uses useState and useEffect: it
// has state of its own per component that calls it.
export function useFetch<T>(url: string): FetchResult<T> {
  const [state, setState] = useState<FetchState<T>>({ status: "loading" });
  const [attempt, setAttempt] = useState(1);

  useEffect(() => {
    setState({ status: "loading" });
    const controller = new AbortController();
    fetchJson<T>(url, controller.signal).then(
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
  }, [url, attempt]);

  const reload = useCallback(() => setAttempt((previous) => previous + 1), []);

  return useMemo(() => ({ state, attempt, reload }), [state, attempt, reload]);
}
