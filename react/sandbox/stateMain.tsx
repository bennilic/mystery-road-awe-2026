import { createRoot } from "react-dom/client";
import { ControlledInputDemo } from "./ControlledInputDemo.tsx";
import { MutationDemo } from "./MutationDemo.tsx";

const rootElement = document.getElementById("sandboxRoot");
if (!rootElement) {
  throw new Error('sandbox-state.html has no <div id="sandboxRoot"> to mount into.');
}
createRoot(rootElement).render(
  <>
    <ControlledInputDemo />
    <MutationDemo />
  </>,
);
