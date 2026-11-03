import { STORAGE_KEY_BOOKMARKS } from "../../../js/state.ts";

// Reads straight from localStorage (the vanilla app's source of truth for
// bookmarks) instead of copying them into React state, so the Dashboard
// always shows what the vanilla Evidence view last saved.
export function readBookmarkCount(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_BOOKMARKS);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch (error) {
    console.warn("Could not read stored bookmarks, counting 0", error);
    return 0;
  }
}
