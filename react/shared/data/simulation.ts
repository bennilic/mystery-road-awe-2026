// Settings for the dev backend's ?delay / ?fail / ?empty controls (see
// server/app.ts). They exist so loading, error, empty and race behaviour can
// be shown live; production code paths never set them.
export type ResourceName = "case" | "evidence" | "people" | "locations" | "timeline";
export type SimulationOutcome = "normal" | "fail" | "empty";

export interface Simulation {
  // Which endpoint the settings apply to; "all" applies them to every endpoint.
  target: ResourceName | "all";
  delayMs: number;
  outcome: SimulationOutcome;
}

export const NO_SIMULATION: Simulation = { target: "evidence", delayMs: 0, outcome: "normal" };

// Query string appended to one resource's URL ("" when nothing applies to it).
export function simulationQuery(resource: ResourceName, simulation: Simulation): string {
  if (simulation.target !== "all" && simulation.target !== resource) return "";
  const parameters = new URLSearchParams();
  if (simulation.delayMs > 0) parameters.set("delay", String(simulation.delayMs));
  if (simulation.outcome === "fail") parameters.set("fail", "1");
  if (simulation.outcome === "empty") parameters.set("empty", "1");
  const query = parameters.toString();
  return query === "" ? "" : `?${query}`;
}
