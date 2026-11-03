# Exercise 7, Demo 1: HTTP request-response vs. WebSockets

Compared on the real code: the Exercise 6 `fetch()` in `react/shared/api/caseApi.ts` and the
WebSocket connection added in Demo 2 (`react/shared/live/`).

| Question                                | Exercise 6 `fetch("api/evidence")`                                                               | WebSocket (`new WebSocket("/ws")`)                                                              |
| --------------------------------------- | ------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| Who can send data?                      | Only the client starts an exchange. The server answers exactly once and can never speak first.   | Both sides at any time, once the connection is open. The server can send without being asked.    |
| How long does the connection live?      | One request and its one response. The conversation ends with the response (HTTP may reuse the TCP connection, but there is no conversation state). | From the handshake until either side closes it or the network breaks: minutes or hours.          |
| How does the client learn of a change?  | Only by asking again (reload, retry button, polling). Between two requests it knows nothing.     | The server pushes a message the moment the change happens; the client reacts in its `message` handler. |
| Typical cost of "anything new?"         | A full request with headers per question, even when the answer is "no".                          | Nothing is sent while nothing changes; a small frame per change.                                 |
| Failure the client sees                 | `fetch` rejects (no answer) or `response.ok` is false (HTTP 500): handled once per request.      | `error` and `close` events at any later moment; the app must notice and decide what to do.       |
| What the app keeps in memory            | Nothing on the server about the client between requests.                                         | The server keeps one object per open connection (who is connected, what to send to whom).        |

One sentence: with `fetch()` the browser **pulls** data once; with a WebSocket the server can
**push** data whenever it changes.

## Questions

**Why would polling be less suitable for live bookmarks than a WebSocket?**
Polling asks "anything new?" every N seconds. Either N is large and a colleague's bookmark appears
seconds late, or N is small and nearly every request answers "no change" while still costing a
full HTTP exchange per tab per interval. A WebSocket sends one small message only when a bookmark
actually changes, and it arrives immediately.

**Why does the app still need REST endpoints for case data after the Workspace gains a WebSocket?**
The case data (evidence, people, locations, timeline) is large, read-only, requested once and
cacheable, and each resource has a natural URL. Request-response fits that exactly (status codes,
caching, `AbortController`, easy `curl` debugging). The WebSocket carries only the small,
frequently changing shared state (bookmarks, presence). Using it for everything would throw away
HTTP's caching and tooling for no gain, and the bookmark ids on the socket are meaningful only
against the case data that REST delivers.

**When would polling be a reasonable choice despite its disadvantages?**
When updates are rare or a delay of seconds is fine (a build status page), when the infrastructure
cannot hold long-lived connections (some proxies, serverless hosting), when there are very few
clients, or when simplicity matters more than latency: polling is stateless on the server and
needs no reconnect logic.

**When would Server-Sent Events be a better fit than WebSockets?**
When data flows only server to client (a live log, a notification feed, a price ticker, progress
of a long job). SSE is plain HTTP, reconnects automatically in the browser (`EventSource`) and
resumes with `Last-Event-ID`. A WebSocket is the better fit when the client also sends often
and low-latency, like the bookmark toggles here.
