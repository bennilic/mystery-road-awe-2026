# Exercise 7, Demo 10: data flow of one bookmark change, and limitations

Verified end to end in two real browser tabs (Evidence page in tab A, Workspace page in tab B,
no reloads): clicking the star of E03 in tab A made tab B list `E14, E03`; the server log shows
`message from Investigator-95: toggle-bookmark`, tab A's console shows
`[live] message {"type":"bookmarks-updated","bookmarks":["E14","E03"]}`.

## The flow

```text
button click                    react/features/evidence/EvidenceCard.tsx   onClick -> toggleBookmark(item.id)
-> WebSocket message            react/shared/bookmarks/BookmarksContext.tsx -> sendMessage
                                react/shared/live/useWorkspaceSocket.ts    { type: "toggle-bookmark", evidenceId }
-> server validation            server/validateClientMessage.ts            JSON, type, id exists in evidence.json
-> in-memory set                server/workspaceSession.ts                 toggleBookmark(): Set add/delete
-> broadcast                    server/workspaceSession.ts                 broadcast({ type: "bookmarks-updated", bookmarks })
-> React state                  react/shared/live/useWorkspaceSocket.ts    setSharedBookmarkIds(message.bookmarks)
-> updated bookmark UI          EvidenceCard (star), DashboardPage (count), WorkspacePage (list)
```

Every tab, the sender included, receives the broadcast, so every tab follows the same path from
"broadcast" on.

## What would break if one step silently stopped, and how I would notice

| Step                   | If it silently stopped                                                                                  | How I would notice                                                                                          |
| ---------------------- | ------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Click handler          | Nothing is sent.                                                                                        | The star never changes and the server log has no `message from ...: toggle-bookmark` line.                  |
| Client send            | `sendMessage` returns false when the socket is not open; the click is lost.                              | The stars are disabled and the badge is not Live. If it were swallowed, the server log shows no message.    |
| Server validation      | Valid toggles are rejected, or invalid ones pass.                                                        | Rejected: a `rejected message` log line and the red notice in the badge. Passing: only a test notices (the validator tests). |
| In-memory set update   | Broadcast carries the old set; the star flips back or stays.                                              | The unit test of `toggleBookmark`; in the browser the star does not change after a click.                   |
| Broadcast              | The sender's set is right on the server, but no tab learns it: the star never changes in any tab.        | Server log shows the toggle, tabs show nothing, and `[live] message` entries are missing in the console. A reload (new connection) shows the correct set, which is the tell. |
| Client message handler | Messages arrive (console shows them) but React state is not updated.                                       | `[live] message` is logged but the UI does not change; the dev console shows the set differs from the screen. |
| React state to UI      | State is updated but a component keeps its own copy and shows the old star.                               | Tabs disagree with each other: this is why there is exactly one bookmark state (Demo 7).                    |

The worst case is the quiet one: a step that fails without any error and leaves a plausible-looking
screen. The two defences used here are the explicit logs on both sides (`[live]`, `[realtime]`) and
the `request-state` on reconnect, which repairs a missed broadcast the next time it runs.

## Limitations of this exercise

- **One session.** Every connection shares one bookmark set; there are no rooms or cases.
- **In-memory only.** A server restart empties the bookmarks; names and presence are rebuilt.
- **One server process.** A second instance would have its own set and its own tabs.
- **No authentication or authorization.** Anyone who can reach the port can connect, see everyone,
  and toggle any bookmark. Display names are random labels, not identities, and are reused.
- **No Origin check and no rate limit.** Another website could open the socket from a visitor's
  browser; a valid message can be repeated without limit (the frame size is limited to 16 KiB).
- **Plain `ws://`** in development; production needs `wss://`.
- **No heartbeat.** A silently dead connection is noticed late, so presence can show ghosts and
  the Live badge can be wrong for a while.
- **One automatic reconnect, no backoff.** After that the user presses Reconnect.
- **No offline editing.** While disconnected the stars are disabled instead of queueing changes.
- **Toggle, not set.** Two users toggling the same item at once cancel each other out.
- **Only bookmarks are live.** Notes, review edits and the hypothesis are still local to the tab.
- **Dev only.** Like the Exercise 6 API, the WebSocket server is not part of the GitHub Pages
  deploy, so there the React page shows the disconnected state and cannot change bookmarks.
  The vanilla `index.html` app is unchanged and keeps its own local bookmarks.
- **Tests.** The server and the reconnect logic have automated tests; the React components are
  checked in a real browser by hand (there is no browser test runner in this project).

## For a production multiuser app

Would change: persistence (a database for bookmarks and sessions), several sessions or rooms,
sign-in with the authenticated user attached to the connection (instead of random names),
authorization per session, `wss://` and an Origin check, rate limits, heartbeat plus
exponential backoff with jitter, version numbers for stale-write detection, a shared broker
(pub/sub) when there is more than one server process, metrics and structured logging.

Could stay: the discriminated-union protocol and the shared types file, the validation at the
server boundary, "server is the source of truth, clients render its latest state", broadcasting a
complete small set (switch to deltas plus versions only if the state grows), the
`WorkspaceSession` seam where storage and fan-out are plugged in, the `ReconnectingSocket`
status/reconnect logic with `request-state`, and REST for the large read-only case data.
