import { useWorkspaceSocket } from "../../shared/live/useWorkspaceSocket.ts";

export function LivePanel() {
  const { status, myName, presenceNames } = useWorkspaceSocket();
  return (
    <div className="live-panel" id="livePanel">
      <p>
        <strong>Live connection:</strong> <output id="liveStatus">{status}</output>
        {myName && (
          <>
            {" "}
            &middot; You are <strong id="liveMyName">{myName}</strong>
          </>
        )}
      </p>
      <p className="hint-text">
        Connected now ({presenceNames.length}):{" "}
        <span id="livePresence">
          {presenceNames.map((name) => (
            <span className={name === myName ? "tag-chip live-me" : "tag-chip"} key={name}>
              {name}
            </span>
          ))}
        </span>
      </p>
    </div>
  );
}
