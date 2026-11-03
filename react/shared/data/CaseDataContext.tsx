import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { CaseInfo, Evidence, Location, Person, TimelineEvent } from "../../../js/types.ts";

export interface CaseData {
  caseInfo: CaseInfo;
  evidence: Evidence[];
  people: Person[];
  locations: Location[];
  timeline: TimelineEvent[];
}

type CaseDataState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: CaseData };

const CaseDataContext = createContext<CaseDataState | null>(null);

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${url} answered HTTP ${response.status} ${response.statusText}`);
  }
  return (await response.json()) as T;
}

async function loadCaseData(): Promise<CaseData> {
  const [caseInfo, evidence, people, locations, timeline] = await Promise.all([
    fetchJson<CaseInfo>("data/case.json"),
    fetchJson<Evidence[]>("data/evidence.json"),
    fetchJson<Person[]>("data/people.json"),
    fetchJson<Location[]>("data/locations.json"),
    fetchJson<TimelineEvent[]>("data/timeline.json"),
  ]);
  return { caseInfo, evidence, people, locations, timeline };
}

// PLACEHOLDER ARCHITECTURE (Exercise 3): loads the same five data/*.json
// files the vanilla app loads, once, and hands them down through context.
// It deliberately does NOT reuse js/dataLoading.ts — that module writes into
// the mutable `state` singleton and pokes the DOM (loading overlay,
// dropdowns), neither of which a React tree should depend on. Exercises 4/5
// are expected to replace this with proper state management once more than
// one view needs to *write* shared data (bookmarks, notes, hypothesis).
export function CaseDataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CaseDataState>({ status: "loading" });

  useEffect(() => {
    // `cancelled` stops a late response from updating an unmounted provider
    // (StrictMode mounts effects twice in development).
    let cancelled = false;
    loadCaseData().then(
      (data) => {
        if (!cancelled) setState({ status: "ready", data });
      },
      (error: unknown) => {
        if (cancelled) return;
        const reason = error instanceof Error ? error.message : String(error);
        setState({ status: "error", message: reason });
      },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  return <CaseDataContext.Provider value={state}>{children}</CaseDataContext.Provider>;
}

export function useCaseData(): CaseDataState {
  const state = useContext(CaseDataContext);
  if (!state) throw new Error("useCaseData() must be used inside <CaseDataProvider>.");
  return state;
}
