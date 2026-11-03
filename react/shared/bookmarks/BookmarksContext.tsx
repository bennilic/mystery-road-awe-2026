import { createContext, useContext, useState, type ReactNode } from "react";
import { readBookmarkIds, writeBookmarkIds } from "../storage/bookmarkStorage.ts";
import { describeStorageFailure } from "../storage/describeStorageFailure.ts";
import { toggleBookmarkId } from "./toggleBookmarkId.ts";

interface BookmarksValue {
  bookmarkedIds: string[];
  toggleBookmark: (evidenceId: string) => void;
  // Set when the browser refused to save; the bookmark stays toggled on screen.
  storageNotice: string | null;
}

const BookmarksContext = createContext<BookmarksValue | null>(null);

// The state is still an ordinary useState; Context only carries it (and its
// updater) to any descendant without passing props through the layers between.
export function BookmarksProvider({ children }: { children: ReactNode }) {
  const [bookmarkedIds, setBookmarkedIds] = useState(readBookmarkIds);
  const [storageNotice, setStorageNotice] = useState<string | null>(null);

  function toggleBookmark(evidenceId: string) {
    const nextIds = toggleBookmarkId(bookmarkedIds, evidenceId);
    setBookmarkedIds(nextIds);
    try {
      writeBookmarkIds(nextIds);
    } catch (error) {
      setStorageNotice(describeStorageFailure("Your bookmark", error));
    }
  }

  return (
    <BookmarksContext.Provider value={{ bookmarkedIds, toggleBookmark, storageNotice }}>
      {children}
    </BookmarksContext.Provider>
  );
}

export function useBookmarks(): BookmarksValue {
  const value = useContext(BookmarksContext);
  if (!value) throw new Error("useBookmarks() must be used inside <BookmarksProvider>.");
  return value;
}

export function BookmarkStorageNotice() {
  const { storageNotice } = useBookmarks();
  return storageNotice ? <p role="alert">{storageNotice}</p> : null;
}
