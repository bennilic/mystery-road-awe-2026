import { useLiveWorkspace } from "../live/LiveWorkspaceContext.tsx";

interface BookmarksValue {
  // Always the latest set the server sent: this tab never keeps its own copy.
  bookmarkedIds: string[];
  // Asks the server to toggle; the star changes when the server's answer arrives.
  toggleBookmark: (evidenceId: string) => void;
  // False while there is no live connection, because a click could not reach the server.
  canToggle: boolean;
}

// Since Exercise 7 the bookmarks are shared state owned by the server (see
// server/workspaceSession.ts). This hook keeps the interface the components
// already used (bookmarkedIds, toggleBookmark), so none of them had to change
// how they read bookmarks.
export function useBookmarks(): BookmarksValue {
  const { status, sharedBookmarkIds, sendMessage } = useLiveWorkspace();
  return {
    bookmarkedIds: sharedBookmarkIds,
    toggleBookmark: (evidenceId) => {
      sendMessage({ type: "toggle-bookmark", evidenceId });
    },
    canToggle: status === "live",
  };
}
