import type { CaseInfo, Evidence, Location, Person, TimelineEvent } from "../../../js/types.ts";
import { simulationQuery, type ResourceName, type Simulation } from "./simulation.ts";

// API-access layer: the only place that knows the backend's URLs and response
// shapes. It has no React in it and no loading/error state; it either returns
// the data or throws an Error that says what failed.

// Relative on purpose (no leading slash): resolves against the page, and Vite
// proxies /api to the dev backend (see vite.config.js).
function resourceUrl(resource: ResourceName, simulation: Simulation): string {
  return `api/${resource}${simulationQuery(resource, simulation)}`;
}

// Identifies one request's inputs, so callers can tell when to load again.
export function requestKey(resource: ResourceName, simulation: Simulation): string {
  return resourceUrl(resource, simulation);
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

export async function fetchCaseInfo(
  simulation: Simulation,
  signal: AbortSignal,
): Promise<CaseInfo> {
  const caseInfo = await fetchJson<CaseInfo>(resourceUrl("case", simulation), signal);
  if (!caseInfo.caseId) {
    throw new Error("api/case answered HTTP 200 but its body is not a case (no caseId)");
  }
  return caseInfo;
}

export function fetchEvidence(simulation: Simulation, signal: AbortSignal): Promise<Evidence[]> {
  return fetchJson<Evidence[]>(resourceUrl("evidence", simulation), signal);
}

export function fetchPeople(simulation: Simulation, signal: AbortSignal): Promise<Person[]> {
  return fetchJson<Person[]>(resourceUrl("people", simulation), signal);
}

export function fetchLocations(simulation: Simulation, signal: AbortSignal): Promise<Location[]> {
  return fetchJson<Location[]>(resourceUrl("locations", simulation), signal);
}

export function fetchTimeline(
  simulation: Simulation,
  signal: AbortSignal,
): Promise<TimelineEvent[]> {
  return fetchJson<TimelineEvent[]>(resourceUrl("timeline", simulation), signal);
}
