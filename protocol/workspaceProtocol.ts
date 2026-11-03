// Exercise 7: the one definition of every message that crosses the WebSocket.
// The browser (react/shared/live/) and the Node server (server/) both import
// this file, so a renamed field or a new message type is a compile error on
// BOTH sides instead of a silent mismatch at runtime. It holds only types and
// no runtime code, so it adds nothing to either bundle.

// Browser -> server.
export type ClientMessage =
  { type: "toggle-bookmark"; evidenceId: string } | { type: "request-state" };

// Server -> browser.
export type ServerMessage =
  | { type: "welcome"; name: string }
  | { type: "workspace-state"; bookmarks: string[] }
  | { type: "bookmarks-updated"; bookmarks: string[] }
  | { type: "presence-updated"; names: string[] };
