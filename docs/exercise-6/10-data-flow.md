# Exercise 6 — Data flow of the evidence list (Demo 10)

Following one piece of data, evidence item E01 ("Morning calibration failure report"), from the file to the screen.

```
public/data/evidence.json            the file (source of truth, also read by the vanilla app)
        |  readFile, sent unchanged
        v
GET /api/evidence                    server/app.ts      (dev only; ?delay / ?fail / ?empty simulate conditions)
        |  Vite proxy: /api/* -> 127.0.0.1:3001 (same origin for the browser, no CORS)
        v
fetchEvidence(simulation, signal)    react/shared/api/caseApi.ts    the only file that calls fetch
        |  Promise<Evidence[]>, throws Error("api/evidence answered HTTP 500 ...")
        v
useAsyncResource(load, key)          react/shared/data/useAsyncResource.ts
        |  {status: "loading" | "error" | "ready"}, AbortController, reload
        v
CaseDataProvider                     react/shared/data/CaseDataContext.tsx
        |  combines 5 results, fixes E04's person reference, context value
        v
CaseDataGate -> EvidencePage         react/shared/data/CaseDataGate.tsx, react/features/evidence/EvidencePage.tsx
        |  spinner | error box + retry | children(data); empty list -> empty state
        v
EvidenceCard                         react/features/evidence/EvidenceCard.tsx
        v
screen: card "Morning calibration failure report - E01 - test-report - Oct 16, 2026 08:49 AM"
```

Verified in the running app: the card with that title and id E01 is on the Evidence page, and
`curl localhost:3001/api/evidence` returns the same title for E01.

## What breaks if one step silently stops

| Step | Silent failure | How it shows |
| --- | --- | --- |
| Vite proxy / backend not running | no data reaches the app | error box "api/case answered HTTP 502 Bad Gateway ... npm run server" (seen in Demo 5) |
| `normalizePersonIds` in the provider | E04 keeps "Nova Byte" instead of a person id | filtering by Nova Byte would omit E04; today the filter returns E04, E18, E05, E06, E17 |
| AbortController in the hook cleanup | a slow older request overwrites a newer one | Dev panel: "Showing: request #2" after "#3" (Demo 7) |
