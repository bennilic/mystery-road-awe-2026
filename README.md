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
