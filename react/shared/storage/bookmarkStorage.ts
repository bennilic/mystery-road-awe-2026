import { STORAGE_KEY_BOOKMARKS } from "../../../js/state.ts";

// Promoted from features/dashboard/ to shared/ in Exercise 5: the Evidence
// and Workspace pages need the bookmark ids too (second feature = shared).
// The key is the vanilla app's, so both apps see the same bookmarks.
export function readBookmarkIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_BOOKMARKS);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((entry): entry is string => typeof entry === "string");
  } catch (error) {
    console.warn("Could not read stored bookmarks, starting with none", error);
    return [];
  }
}

// Throws if the browser refuses the write (private mode, quota full). The
// caller decides how to tell the user; swallowing it here would hide it.
export function writeBookmarkIds(ids: string[]): void {
  localStorage.setItem(STORAGE_KEY_BOOKMARKS, JSON.stringify(ids));
}
