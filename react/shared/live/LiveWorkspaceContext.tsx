import { createContext, useContext, type ReactNode } from "react";
import { useWorkspaceSocket, type WorkspaceSocket } from "./useWorkspaceSocket.ts";

const LiveWorkspaceContext = createContext<WorkspaceSocket | null>(null);

// One WebSocket for the whole app, opened when the app mounts (not per page),
// so a tab is "connected" and shows the shared bookmarks wherever it is.
export function LiveWorkspaceProvider({ children }: { children: ReactNode }) {
  const socket = useWorkspaceSocket();
  return <LiveWorkspaceContext.Provider value={socket}>{children}</LiveWorkspaceContext.Provider>;
}

export function useLiveWorkspace(): WorkspaceSocket {
  const value = useContext(LiveWorkspaceContext);
  if (!value) throw new Error("useLiveWorkspace() must be used inside <LiveWorkspaceProvider>.");
  return value;
}
