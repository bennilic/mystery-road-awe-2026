# Exercise 7, Demo 7: why bookmarks are easy to synchronize

## Set-like state

A bookmark has no content of its own: for each evidence id the only fact is **present or absent**.
The whole shared state is therefore a set of ids (`Set<string>` in `server/workspaceSession.ts`),
and a toggle is "flip membership of one id". There is no order, no position, no merge of text.

## Demonstration (two surfaces, no local action)

1. Evidence page open in a browser tab, no stars active, `localStorage` empty.
2. A plain Node WebSocket client (not the app) sends `toggle-bookmark` for `E01` and `E05`.
3. The stars of E01 and E05 turned active in the open tab although nothing was clicked there.
   `localStorage` stayed empty. A second toggle from the outside client switched them off again.

That is only possible because the tab does not keep a bookmark list of its own: the one
bookmark state in the browser is `sharedBookmarkIds` in `react/shared/live/useWorkspaceSocket.ts`,
and it is written in exactly one place, the handler for `workspace-state` / `bookmarks-updated`.
`useBookmarks()` returns that array, `EvidenceCard` computes `isBookmarked` with
`bookmarkedIds.includes(item.id)` during render, the Dashboard count and the Workspace list use
`selectBookmarkedEvidence(evidence, bookmarkedIds)`. A grep for `useState`/`localStorage` next to
"bookmark" in `react/` (outside the sandbox) finds only that one line.

Tests: `server/workspaceSession.test.ts` (order of different toggles does not matter, toggling the
same id twice returns to the start) and `server/realtime.test.ts` (two clients toggling the same
id at once end in the same state).

## Questions

**What kind of conflict is structurally avoided when two users bookmark different evidence items?**
Write-write conflict on the same data. E01 and E05 are different members of the set; adding one
does not read, change or depend on the other, so the operations commute: the result is the same
in either order and nobody's change overwrites anybody's.

**Why is synchronizing a set of ids simpler than synchronizing the contents of a shared text note?**
The unit of change is one whole, independent fact (id present or not), the state is tiny, and the
complete value can be re-sent in every message. A note is ordered, long text edited in the middle
by several people at once: "insert at position 40" and "delete 30 to 45" depend on each other and
on what the text looked like when they were made. Overwriting loses someone's typing, so a merge
strategy (operational transformation, CRDTs) or locking is needed.

**What happens if two users toggle the same evidence item at nearly the same time?**
The server handles messages one at a time, in the order they arrive. Two toggles of an absent id
add it and then remove it again, so it ends absent, and both tabs receive both broadcasts in the
same order and end on the same set (tested). That can surprise users (both meant "bookmark it"),
because a toggle is relative to the current state. An explicit `set-bookmark { evidenceId,
isBookmarked }` message would be idempotent: two "set to true" end with the id present.

**How could the server attach a version number if the application later needed to detect stale writes?**
Keep a counter in `WorkspaceSession`, increase it on every change and send it in
`workspace-state` / `bookmarks-updated` (`version: 12`). The client remembers the last version and
includes it in what it sends (`{ type: "toggle-bookmark", evidenceId, baseVersion: 12 }`). If
`baseVersion` is older than the server's current version, the server rejects the write or answers
with the current state so the client can show a warning (last-write-wins with a warning, or ask
the user). The same number also lets a client notice that it missed an update.
