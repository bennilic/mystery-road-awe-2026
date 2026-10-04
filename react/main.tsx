import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.tsx";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error('react.html has no <div id="root"> to mount the React app into.');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
