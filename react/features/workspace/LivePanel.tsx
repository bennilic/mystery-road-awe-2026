import { useWorkspaceSocket } from "../../shared/live/useWorkspaceSocket.ts";

export function LivePanel() {
  const { status, myName, presenceNames, sharedBookmarkIds } = useWorkspaceSocket();
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
      <p className="hint-text">
        Shared bookmarks ({sharedBookmarkIds.length}):{" "}
        <span id="liveBookmarks">{sharedBookmarkIds.join(", ") || "none yet"}</span>
      </p>
    </div>
  );
}
