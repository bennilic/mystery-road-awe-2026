import { useWorkspaceSocket } from "../../shared/live/useWorkspaceSocket.ts";

export function LivePanel() {
  const { status, lastReply } = useWorkspaceSocket();
  return (
    <div className="live-panel" id="livePanel">
      <strong>Live connection:</strong> <output id="liveStatus">{status}</output>
      {lastReply && (
        <p className="hint-text">
          Server said: <output id="liveReply">{lastReply}</output>
        </p>
      )}
    </div>
  );
}
