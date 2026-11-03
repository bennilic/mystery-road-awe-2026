import { useState } from "react";
import { useCaseData, useReloadCaseData } from "../shared/data/CaseDataContext.tsx";
import {
  NO_SIMULATION,
  type ResourceName,
  type Simulation,
  type SimulationOutcome,
} from "../shared/api/simulation.ts";

const TARGETS: ReadonlyArray<Simulation["target"]> = [
  "evidence",
  "case",
  "people",
  "locations",
  "timeline",
  "all",
];
const OUTCOMES: ReadonlyArray<SimulationOutcome> = ["normal", "fail", "empty"];

// Development-only controls for the backend's ?delay / ?fail / ?empty
// simulation (App.tsx renders this only when import.meta.env.DEV is true).
export function DevPanel() {
  const [simulation, setSimulation] = useState<Simulation>(NO_SIMULATION);
  const caseData = useCaseData();
  const reload = useReloadCaseData();

  const shownRequest =
    caseData.status === "ready" ? `request #${caseData.requestId}` : caseData.status;

  return (
    <aside className="dev-panel" aria-label="Development tools" id="devPanel">
      <strong>Dev: simulate the backend</strong>
      <label>
        Endpoint{" "}
        <select
          id="devTarget"
          value={simulation.target}
          onChange={(event) =>
            setSimulation({ ...simulation, target: event.target.value as ResourceName | "all" })
          }
        >
          {TARGETS.map((target) => (
            <option key={target}>{target}</option>
          ))}
        </select>
      </label>
      <label>
        Delay (ms){" "}
        <input
          id="devDelay"
          type="number"
          min={0}
          step={500}
          value={simulation.delayMs}
          onChange={(event) =>
            setSimulation({ ...simulation, delayMs: Number(event.target.value) || 0 })
          }
        />
      </label>
      <label>
        Outcome{" "}
        <select
          id="devOutcome"
          value={simulation.outcome}
          onChange={(event) =>
            setSimulation({ ...simulation, outcome: event.target.value as SimulationOutcome })
          }
        >
          {OUTCOMES.map((outcome) => (
            <option key={outcome}>{outcome}</option>
          ))}
        </select>
      </label>
      <button
        type="button"
        id="devReload"
        className="btn btn-small"
        onClick={() => reload(simulation)}
      >
        Reload case data
      </button>
      <span>
        Showing: <output id="devShown">{shownRequest}</output>
      </span>
    </aside>
  );
}
