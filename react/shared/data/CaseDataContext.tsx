import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import {
  NO_SIMULATION,
  simulationQuery,
  type ResourceName,
  type Simulation,
} from "./simulation.ts";
import { useFetch, type FetchResult } from "./useFetch.ts";
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
  // requestId: which attempt the visible data came from (shown in the dev panel).
  | { status: "ready"; data: CaseData; requestId: number };

interface CaseDataContextValue {
  state: CaseDataState;
  // Starts a new request; without an argument it repeats the previous simulation.
  reload: (simulation?: Simulation) => void;
}

const CaseDataContext = createContext<CaseDataContextValue | null>(null);

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

// Five independent useFetch calls become one state for the pages: loading
// while any is loading, error as soon as one failed, ready when all are.
function combineStates(
  caseInfo: FetchResult<CaseInfo>,
  evidence: FetchResult<Evidence[]>,
  people: FetchResult<Person[]>,
  locations: FetchResult<Location[]>,
  timeline: FetchResult<TimelineEvent[]>,
): CaseDataState {
  const states = [caseInfo.state, evidence.state, people.state, locations.state, timeline.state];
  const failed = states.find((state) => state.status === "error");
  if (failed?.status === "error") return failed;
  if (
    caseInfo.state.status !== "ready" ||
    evidence.state.status !== "ready" ||
    people.state.status !== "ready" ||
    locations.state.status !== "ready" ||
    timeline.state.status !== "ready"
  ) {
    return { status: "loading" };
  }
  if (!caseInfo.state.data.caseId) {
    return {
      status: "error",
      message: "api/case answered HTTP 200 but its body is not a case (no caseId)",
    };
  }
  return {
    status: "ready",
    requestId: caseInfo.attempt,
    data: {
      caseInfo: caseInfo.state.data,
      evidence: normalizePersonIds(evidence.state.data, people.state.data),
      people: people.state.data,
      locations: locations.state.data,
      timeline: timeline.state.data,
    },
  };
}

// Exercise 6: the five resources come from the dev backend (server/, reached
// through the Vite proxy at /api/...). All loading, error and cancellation
// logic lives in useFetch; what stays here is what is specific to this app:
// which urls, the simulation settings and how the five results combine.
export function CaseDataProvider({ children }: { children: ReactNode }) {
  const [simulation, setSimulation] = useState<Simulation>(NO_SIMULATION);
  const url = (resource: ResourceName) => `api/${resource}${simulationQuery(resource, simulation)}`;

  const caseInfo = useFetch<CaseInfo>(url("case"));
  const evidence = useFetch<Evidence[]>(url("evidence"));
  const people = useFetch<Person[]>(url("people"));
  const locations = useFetch<Location[]>(url("locations"));
  const timeline = useFetch<TimelineEvent[]>(url("timeline"));

  // combineStates builds new objects, so memoise it: the context value then
  // only changes when one of the five results changes.
  const state = useMemo(
    () => combineStates(caseInfo, evidence, people, locations, timeline),
    [caseInfo, evidence, people, locations, timeline],
  );

  const reloadCase = caseInfo.reload;
  const reloadEvidence = evidence.reload;
  const reloadPeople = people.reload;
  const reloadLocations = locations.reload;
  const reloadTimeline = timeline.reload;
  const reload = useCallback(
    (nextSimulation?: Simulation) => {
      if (nextSimulation) setSimulation(nextSimulation);
      reloadCase();
      reloadEvidence();
      reloadPeople();
      reloadLocations();
      reloadTimeline();
    },
    [reloadCase, reloadEvidence, reloadPeople, reloadLocations, reloadTimeline],
  );

  const value = useMemo(() => ({ state, reload }), [state, reload]);
  return <CaseDataContext.Provider value={value}>{children}</CaseDataContext.Provider>;
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
