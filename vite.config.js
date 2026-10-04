import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Relative base ("./" instead of the default "/") so the built app's asset
// URLs work both at a domain root and at a GitHub Pages project-site path
// like /mystery-road-awe-2026/ — without this, the production build's
// injected <script>/<link> tags would 404 once deployed under a subpath.
//
// Exercise 3: the React migration ships as a second HTML entry point
// (react.html) next to the untouched vanilla index.html. Vite's dev server
// serves every root-level .html file as-is, but `vite build` only bundles
// the entries listed in rollupOptions.input — without listing both, the
// production build would silently drop react.html.
export default defineConfig({
  base: "./",
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: "index.html",
        react: "react.html",
      },
    },
  },
});
