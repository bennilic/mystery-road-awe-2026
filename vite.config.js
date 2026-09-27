import { defineConfig } from "vite";

// Relative base ("./" instead of the default "/") so the built app's asset
// URLs work both at a domain root and at a GitHub Pages project-site path
// like /mystery-road-awe-2026/ — without this, the production build's
// injected <script>/<link> tags would 404 once deployed under a subpath.
export default defineConfig({
  base: "./",
});
