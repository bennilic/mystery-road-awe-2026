# Exercise 7 — WebSockets & Multiuser Applications

This exercise builds on Exercises 3–6. It introduces one small real-time feature: multiple browser tabs can see bookmark changes in the same investigation Workspace without reloading.

The server may live beside the Exercise 6 Node API and keeps its state in memory only. If it restarts, the shared bookmarks reset. A single shared session is enough for the required implementation.

## Corresponding manuscript reading

This exercise corresponds mainly to:

- **Chapter 23, WebSocket Foundations** — PDF pp. 168–175
- **Chapter 24, Designing a Multiuser Message Architecture** — PDF pp. 176–184
- **Chapter 25, Reliability and Security in Real-Time Applications** — PDF pp. 185–191, for the optional extensions and discussion

## Self-Check

The exercise has 10 required tasks. The optional extension questions are for those who want to explore the next level. They are not required for the basic exercise demonstration.

| # | Demo | Ready? |
|---|---|---|
| 1 | HTTP request-response vs. WebSockets | ☑ |
| 2 | Minimal WebSocket lifecycle | ☑ |
| 3 | Client identity and presence | ☐ |
| 4 | Small typed message protocol | ☐ |
| 5 | In-memory shared server state | ☐ |
| 6 | Live bookmark updates | ☐ |
| 7 | Why bookmarks are easy to synchronize | ☐ |
| 8 | Disconnect and reconnect | ☐ |
| 9 | Validation and security boundaries | ☐ |
| 10 | Data-flow explanation and limitations | ☐ |

---

## Demo 1 — HTTP request-response vs. WebSockets

### Required task

- [x] Create a short comparison of an Exercise 6 `fetch()` request and a WebSocket connection. Include who can send data, how long the connection lives, and how the client learns about a server-side change.

### Questions

- [x] Why would polling be less suitable for live bookmarks than a WebSocket? 
- [x] Why does the app still need REST endpoints for case data even after the Workspace gains a WebSocket connection?
- [x] When would polling be a reasonable choice despite its disadvantages?
- [x] When would Server-Sent Events be a better fit than WebSockets?

---

## Demo 2 — Minimal WebSocket lifecycle

### Required task

- [x] Add a minimal WebSocket server and client. The client connects, sends one message, receives one response, and displays a connection status. Log `open`, `message`, `close`, and `error` while testing.

### Questions

- [x] Why does a WebSocket connection begin with an HTTP-based handshake?
- [x] What is the difference between an open connection, a closed connection, and a failed connection attempt in the browser?
- [x] How would you distinguish a deliberate client close from a network failure?

---

## Demo 3 — Client identity and presence

### Required task

- [ ] Assign each connection a random display name, such as `Investigator-42`, and show the current name plus a list of connected names in the Workspace. Test with at least two browser tabs.

### Questions

- [ ] Where does the authoritative list of connected users live?
- [ ] What should happen to a user's presence entry when their connection closes?
- [ ] How could a tab crash or a laptop lose power make presence temporarily inaccurate?
- [ ] What extra information would be needed to show which evidence item someone is viewing?

---

## Demo 4 — Small typed message protocol

### Required task

- [ ] Define and share a small discriminated-union protocol covering the required messages:

```ts
type ClientMessage =
  | { type: "toggle-bookmark"; evidenceId: string }
  | { type: "request-state" };

type ServerMessage =
  | { type: "welcome"; name: string }
  | { type: "workspace-state"; bookmarks: string[] }
  | { type: "bookmarks-updated"; bookmarks: string[] }
  | { type: "presence-updated"; names: string[] };
```

### Questions

- [ ] Why is a `type` discriminator safer and clearer than one object with many optional properties?
- [ ] How are the message types shared between the browser and Node server, and what problem does that prevent?
- [ ] How would you add a message for a note update without changing the existing bookmark message shape?
- [ ] Where should runtime validation be added?

---

## Demo 5 — In-memory shared server state

### Required task

- [ ] Store the shared bookmark ids in server memory. Send the current state to a newly connected client after it joins. Keep the single Workspace session scoped behind a small collection of session connections rather than scattering broadcast loops through message handlers.

### Questions

- [ ] Why should the server be the source of truth for shared bookmarks instead of trusting each browser's local state?
- [ ] What is lost when the server restarts, and why is that acceptable for this exercise?
- [ ] What would need to change to support two isolated sessions instead of one?
- [ ] Why might a database or session store be needed in a production version?

---

## Demo 6 — Live bookmark updates

### Required task

- [ ] Send a bookmark toggle from one browser to the server. Update the in-memory set and broadcast the new bookmark set to every connected client. Demonstrate the change appearing in a second tab without a reload.

### Questions

- [ ] Trace one toggle from the button click through the client message, server update, broadcast, and React state update.
- [ ] Why is broadcasting the complete bookmark set simpler for this small app than broadcasting a sequence of individual operations?
- [ ] Should the sender receive its own broadcast or update optimistically? Explain the choice.
- [ ] How would you reduce message size if the shared state became very large?

---

## Demo 7 — Why bookmarks are easy to synchronize

### Required task

- [ ] Explain and demonstrate that bookmarks are set-like state: each evidence id is either present or absent. Confirm that the local React UI derives its bookmark display from the latest server-provided set.

### Questions

- [ ] What kind of conflict is structurally avoided when two users bookmark different evidence items?
- [ ] Why is synchronizing a set of ids simpler than synchronizing the contents of a shared text note?
- [ ] What happens if two users toggle the same evidence item at nearly the same time?
- [ ] How could the server attach a version number if the application later needed to detect stale writes?

---

## Demo 8 — Disconnect and reconnect

### Required task

- [ ] Show a visible `Live`, `Disconnected`, or `Reconnecting…` status. After a connection loss, attempt one automatic reconnect after a short delay and request the current bookmark state again.

### Questions

- [ ] Why must a reconnect request the current state instead of assuming the browser did not miss anything?
- [ ] What should the user see while the app is disconnected, and why should local bookmark clicks be handled deliberately during that period?
- [ ] What would a heartbeat detect that browser `close` and `error` events might not detect promptly?

---

## Demo 9 — Validation and security boundaries

### Required task

- [ ] Validate incoming messages on the server. Reject malformed JSON, unknown message types, and bookmark ids that do not exist in the case data. Demonstrate that invalid input produces an error response or is ignored without crashing the server.

### Questions

- [ ] Why can the server not trust TypeScript types or the browser UI to validate a message?
- [ ] Without sign-in, what security boundary does validation still provide, and what does it not provide?
- [ ] How could a malicious client impersonate a display name in the current design?

---

## Demo 10 — Data flow and limitations

### Required task

- [ ] Illustrate the complete flow for one bookmark change:

```text
button click
→ WebSocket message
→ server validation and in-memory set
→ broadcast
→ React state
→ updated bookmark UI
```

- [ ] Explain the limitations of the exercise.

### Questions

- [ ] Pick one step in the diagram and explain what would break if it silently stopped happening and how you would notice.
- [ ] Which parts of the design would need to change for a production multiuser application, and which parts could remain?

---

## Optional extension questions

- [ ] How would you add live notes with an editing indicator but without building a merge algorithm?
- [ ] How would last-write-wins with a warning work for notes, and why might it be unsuitable for a long document?
- [ ] How could you add optimistic UI while still reconciling with the server's response?
- [ ] Why can messages be duplicated or appear stale across reconnects even though TCP preserves order within one connection?

## Optional extensions

- note editing indicators;
- note version numbers and conflict warnings;
- optimistic hypothesis updates;
- multiple rooms or documents;
- heartbeats and exponential backoff;
- duplicate or out-of-order message handling;
- authentication and authorization.

These are useful extension topics, but the required exercise should be completable with one WebSocket connection, one in-memory bookmark set, one presence list, and two browser tabs.
