import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RenderSideEffectDemo } from "./RenderSideEffectDemo.tsx";
import { EffectDependencyDemo } from "./EffectDependencyDemo.tsx";

const rootElement = document.getElementById("sandboxRoot");
if (!rootElement) {
  throw new Error('sandbox-effects.html has no <div id="sandboxRoot"> to mount into.');
}
// StrictMode on purpose: it is what makes the render-time side effect visible.
// ?strict=0 turns it off, so effect run counts can be read without the
// development-only double mount.
const useStrictMode = new URLSearchParams(window.location.search).get("strict") !== "0";
const demos = (
  <>
    <RenderSideEffectDemo />
    <EffectDependencyDemo />
  </>
);
createRoot(rootElement).render(useStrictMode ? <StrictMode>{demos}</StrictMode> : demos);
