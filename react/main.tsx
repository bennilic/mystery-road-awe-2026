import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router";
import { App } from "./app/App.tsx";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error('react.html has no <div id="root"> to mount the React app into.');
}

createRoot(rootElement).render(
  <StrictMode>
    {/* HashRouter: URLs look like react.html#/team/people, which needs no server
        rewrite rules, so it keeps working on GitHub Pages and the Vite dev server. */}
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
);
