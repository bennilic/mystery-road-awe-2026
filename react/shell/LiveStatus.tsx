import { useLiveWorkspace } from "../shared/live/LiveWorkspaceContext.tsx";
import type { ConnectionStatus } from "../shared/live/ReconnectingSocket.ts";

const STATUS_LABELS: Record<ConnectionStatus, string> = {
  connecting: "Connecting…",
  live: "Live",
  reconnecting: "Reconnecting…",
  disconnected: "Disconnected",
};

// Visible on every page: the shared bookmarks are only as current as this
// connection. While it is down the stars are disabled and show the last known state.
export function LiveStatus() {
  const { status, problem, reconnect } = useLiveWorkspace();
  const isDown = status === "reconnecting" || status === "disconnected";
  return (
    <div className={`live-status live-status-${status}`} role="status" id="liveStatusBadge">
      <strong>{STATUS_LABELS[status]}</strong>
      {isDown && (
        <span className="live-status-detail">
          {" "}
          {problem} Bookmarks are shown as last received and cannot be changed until the connection
          is back.
          {status === "disconnected" &&
            " Check that the backend is running (npm run server), then press Reconnect."}
        </span>
      )}
      {status === "disconnected" && (
        <button type="button" className="btn btn-small" id="liveReconnect" onClick={reconnect}>
          Reconnect
        </button>
      )}
    </div>
  );
}
