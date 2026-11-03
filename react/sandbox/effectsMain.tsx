import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RenderSideEffectDemo } from "./RenderSideEffectDemo.tsx";

const rootElement = document.getElementById("sandboxRoot");
if (!rootElement) {
  throw new Error('sandbox-effects.html has no <div id="sandboxRoot"> to mount into.');
}
// StrictMode on purpose: it is what makes the render-time side effect visible.
createRoot(rootElement).render(
  <StrictMode>
    <RenderSideEffectDemo />
  </StrictMode>,
);
