import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import type { Person } from "../../js/types.ts";
import { KeyedPersonList } from "./KeyedPersonList.tsx";

const rootElement = document.getElementById("sandboxRoot");
if (!rootElement) {
  throw new Error('sandbox-keys.html has no <div id="sandboxRoot"> to mount into.');
}
const root = createRoot(rootElement);

async function start(): Promise<void> {
  const response = await fetch("data/people.json");
  if (!response.ok) {
    throw new Error(`data/people.json answered HTTP ${response.status} ${response.statusText}`);
  }
  let people = (await response.json()) as Person[];
  // flushSync: render synchronously so the input exists before we type into it.
  flushSync(() => root.render(<KeyedPersonList people={people} />));

  // Simulates the user typing into the FIRST row, before the list changes.
  // Setting .value makes the field "dirty", like real typing does.
  const firstInput = rootElement!.querySelector("input");
  if (firstInput) firstInput.value = "typed for the first person";

  document.getElementById("reverseBtn")?.addEventListener("click", () => {
    people = [...people].reverse();
    root.render(<KeyedPersonList people={people} />);
  });
  document.getElementById("dropFirstBtn")?.addEventListener("click", () => {
    people = people.slice(1);
    root.render(<KeyedPersonList people={people} />);
  });
}

start().catch((error: unknown) => {
  rootElement.textContent = `Sandbox could not start: ${error instanceof Error ? error.message : String(error)}. Check that the dev server is running.`;
});
