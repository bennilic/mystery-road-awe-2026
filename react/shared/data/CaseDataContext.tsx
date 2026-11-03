import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import {
  NO_SIMULATION,
  simulationQuery,
  type ResourceName,
  type Simulation,
} from "./simulation.ts";
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
  | { status: "ready"; data: CaseData; requestId: number };

// One attempt to load the case data. `id` numbers the attempts so the dev
// panel can show which request the visible data came from.
interface DataRequest {
  id: number;
  simulation: Simulation;
}

interface CaseDataContextValue {
  state: CaseDataState;
  // Starts a new request; without an argument it repeats the previous simulation.
  reload: (simulation?: Simulation) => void;
}

const CaseDataContext = createContext<CaseDataContextValue | null>(null);

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

async function loadCaseData(simulation: Simulation): Promise<CaseData> {
  const url = (resource: ResourceName) => `api/${resource}${simulationQuery(resource, simulation)}`;
  const [caseInfo, evidence, people, locations, timeline] = await Promise.all([
    fetchJson<CaseInfo>(url("case")),
    fetchJson<Evidence[]>(url("evidence")),
    fetchJson<Person[]>(url("people")),
    fetchJson<Location[]>(url("locations")),
    fetchJson<TimelineEvent[]>(url("timeline")),
  ]);
  if (!caseInfo.caseId) {
    throw new Error("api/case answered HTTP 200 but its body is not a case (no caseId)");
  }
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
  const [request, setRequest] = useState<DataRequest>({ id: 1, simulation: NO_SIMULATION });

  useEffect(() => {
    setState({ status: "loading" });
    loadCaseData(request.simulation).then(
      (data) => setState({ status: "ready", data, requestId: request.id }),
      (error: unknown) => {
        const reason = error instanceof Error ? error.message : String(error);
        setState({ status: "error", message: reason });
      },
    );
  }, [request]);

  const reload = useCallback((simulation?: Simulation) => {
    setRequest((previous) => ({
      id: previous.id + 1,
      simulation: simulation ?? previous.simulation,
    }));
  }, []);

  return <CaseDataContext.Provider value={{ state, reload }}>{children}</CaseDataContext.Provider>;
}

function useCaseDataContext(): CaseDataContextValue {
  const value = useContext(CaseDataContext);
  if (!value) throw new Error("useCaseData() must be used inside <CaseDataProvider>.");
  return value;
}

export function useCaseData(): CaseDataState {
  return useCaseDataContext().state;
}

export function useReloadCaseData(): (simulation?: Simulation) => void {
  return useCaseDataContext().reload;
}
