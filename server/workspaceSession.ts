import { WebSocket } from "ws";
import type { ServerMessage } from "../protocol/workspaceProtocol.ts";
import { createDisplayName } from "./displayName.ts";

// The one Workspace session: who is connected and which evidence is bookmarked.
// Everything that touches a connection or the shared state goes through this
// class, so message handlers never loop over sockets themselves and a second
// session would be a second instance, not a rewrite.
export class WorkspaceSession {
  private readonly namesBySocket = new Map<WebSocket, string>();
  // A Set: an evidence id is either bookmarked or not, never twice.
  private readonly bookmarkIds = new Set<string>();

  /** Registers the connection and returns the unique name it was given. */
  join(socket: WebSocket): string {
    const name = createDisplayName(new Set(this.namesBySocket.values()));
    this.namesBySocket.set(socket, name);
    return name;
  }

  leave(socket: WebSocket): void {
    this.namesBySocket.delete(socket);
  }

  get names(): string[] {
    return [...this.namesBySocket.values()];
  }

  get bookmarks(): string[] {
    return [...this.bookmarkIds];
  }

  /** Adds the id when absent, removes it when present; returns the new set. */
  toggleBookmark(evidenceId: string): string[] {
    if (!this.bookmarkIds.delete(evidenceId)) this.bookmarkIds.add(evidenceId);
    return this.bookmarks;
  }

  /** Sends to one connection; a connection that is no longer open is skipped, not an error. */
  send(socket: WebSocket, message: ServerMessage): void {
    if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(message));
  }

  /** The only loop over connections: every shared-state change goes out through here. */
  broadcast(message: ServerMessage): void {
    for (const socket of this.namesBySocket.keys()) this.send(socket, message);
  }
}
