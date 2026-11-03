# Project ReMotion – Investigation Portal

Investigate the failure of an AI-assisted rehabilitation robot.

## About

Project ReMotion is a browser-based investigation platform built around a fictional incident.
During a pre-demonstration calibration test, the AI-assisted rehabilitation robot **ReMotion**
loaded the wrong calibration profile and triggered its emergency stop. This application lets an
investigator review the evidence, people, locations, and timeline surrounding the incident, and
build up a working hypothesis about what happened.

This repository contains an existing vanilla-JavaScript (no frameworks used) investigation application. The system is
functional but has accumulated technical debt and inconsistent implementation decisions. Your task
during the course will be to analyse, maintain, refactor, migrate, and extend it.

## Running the application

The app is written in TypeScript and built with [Vite](https://vite.dev), so it cannot be served
by a plain static file server (browsers won't execute `.ts` files, and `file://` blocks `fetch()`).
Use the Vite dev server, which compiles TypeScript on the fly:

```bash
npm install          # first time only
npm run dev -- --port 8080
```

Then open `http://localhost:8080`. The presentation is at `http://localhost:8080/presentation/present.html`.

To check the production build locally: `npm run build && npm run preview`.

## Development backend (Exercise 6, dev only)

The React app (`react.html`) reads its case data from a small read-only Node server instead of
from the static files. **This backend runs locally in development only. It is not deployed and
is not part of the Exercise 2 GitHub Pages pipeline**, which still builds and publishes only the
static frontend.

Run two processes (two terminals):

```bash
npm run server                 # backend on http://127.0.0.1:3001 (serves public/data/*.json)
npm run dev -- --port 8080     # Vite; it proxies /api/* to the backend
```

Endpoints (GET only): `/api/case`, `/api/evidence`, `/api/people`, `/api/locations`,
`/api/timeline`. Each returns exactly the content of the matching `public/data/*.json` file.

Simulating real-world conditions (query parameters on any endpoint):

| Parameter      | Effect                                                           |
| -------------- | ---------------------------------------------------------------- |
| `?delay=<ms>`  | Wait this long before answering (max 30000)                      |
| `?fail=1`      | Answer HTTP 500 (`?fail=503` for another status)                 |
| `?empty=1`     | Answer successfully but with no data (`[]`, or `{}` for `case`)  |

`SIM_DELAY_MS=<ms> npm run server` adds a default delay to every request, `PORT=<n>` changes
the port (then change the proxy target in `vite.config.js` too). `npm test` runs the backend's
tests. The vanilla `index.html` app is unchanged and still reads the static files.

## Features

- **Dashboard** — case summary and key statistics calculated from the loaded case data.
- **Evidence catalogue** — search, filter (by type, person, location, status, relevance), sort,
  bookmark, and open detailed evidence records.
- **People & Locations** — profile cards for the investigation team and the six key locations.
- **Timeline** — chronological view of case events with filtering and links to related evidence.
- **Investigator workspace** — bookmarked evidence, personal notes, and a hypothesis draft form.
  Workspace data is saved to your browser's local storage and will still be there when you reload
  the page.

## Browser requirements

A recent version of any evergreen desktop browser (Chrome, Firefox, Edge, Safari). JavaScript must
be enabled. The layout targets common desktop and tablet widths.

## Project status

This is an existing brownfield application, not a fresh scaffold. It works for everyday use, but
you should expect to find rough edges, inconsistent patterns, and a handful of bugs as you work
with it — that discovery process is part of the course.
