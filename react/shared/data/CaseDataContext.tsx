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
  let response: Response;
  try {
    response = await fetch(url);
  } catch (error) {
    // fetch only rejects when no HTTP answer arrived at all (server down, network cut).
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`${url} could not be reached (${reason})`);
  }
  if (!response.ok) {
    throw new Error(`${url} answered HTTP ${response.status} ${response.statusText}`);
  }
  return (await response.json()) as T;
}

async function loadCaseData(): Promise<CaseData> {
  const [caseInfo, evidence, people, locations, timeline] = await Promise.all([
    fetchJson<CaseInfo>("api/case"),
    fetchJson<Evidence[]>("api/evidence"),
    fetchJson<Person[]>("api/people"),
    fetchJson<Location[]>("api/locations"),
    fetchJson<TimelineEvent[]>("api/timeline"),
  ]);
  return { caseInfo, evidence: normalizePersonIds(evidence, people), people, locations, timeline };
}

// evidence.json's E04 lists "Nova Byte" (a display name) where every other
// record has a person id. Fixed once at the load boundary, as the vanilla
// dataLoading.ts does, so filters and detail views can trust personIds.
function normalizePersonIds(evidence: Evidence[], people: Person[]): Evidence[] {
  const idByName = new Map(people.map((person) => [person.name, person.id]));
  return evidence.map((item) => ({
    ...item,
    personIds: item.personIds.map((reference) => idByName.get(reference) ?? reference),
  }));
}

// Exercise 6: the five resources now come from the dev backend (server/,
// reached through the Vite proxy at /api/...) instead of static files. The
// fetch runs in an effect because it is a side effect (Demo 1): render only
// describes the current state ("loading", "error" or "ready"), and the effect
// starts the request after the first commit and later calls setState with the
// outcome, which makes React render again.
export function CaseDataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CaseDataState>({ status: "loading" });

  useEffect(() => {
    loadCaseData().then(
      (data) => setState({ status: "ready", data }),
      (error: unknown) => {
        const reason = error instanceof Error ? error.message : String(error);
        setState({ status: "error", message: reason });
      },
    );
  }, []);

  return <CaseDataContext.Provider value={state}>{children}</CaseDataContext.Provider>;
}

export function useCaseData(): CaseDataState {
  const state = useContext(CaseDataContext);
  if (!state) throw new Error("useCaseData() must be used inside <CaseDataProvider>.");
  return state;
}
