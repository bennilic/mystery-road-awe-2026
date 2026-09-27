// ---------------------------------------------------------------------
// LOCAL STORAGE HELPERS (bookmarks & notes)
// ---------------------------------------------------------------------
// All six functions are used by at least one other module (evidence.js and
// main.js), so all six are named exports — there's no single "entry point"
// here the way there is in dataLoading.js, just a small set of independent
// read/write helpers around localStorage.
import { state, STORAGE_KEY_BOOKMARKS, STORAGE_KEY_NOTES } from "./state.ts";

// Demo 6: state.ts now declares `bookmarks: string[]` and
// `notesStore: Record<string, string>` directly, so the local
// BookmarkId/NotesStore aliases and cast-through-unknown helpers this file
// needed during Demo 5 (while state.js was still untyped) are gone —
// nothing left to bridge.

export function saveBookmarksToStorage(): void {
  localStorage.setItem(STORAGE_KEY_BOOKMARKS, JSON.stringify(state.bookmarks));
}

export function loadBookmarksFromStorage(): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_BOOKMARKS);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    state.bookmarks = Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch (err) {
    console.warn("Could not read stored bookmarks, starting empty", err);
    state.bookmarks = [];
  }
}

export function saveNoteForEvidence(evidenceId: string, text: string): void {
  state.notesStore[evidenceId] = text;
  localStorage.setItem(STORAGE_KEY_NOTES, JSON.stringify(state.notesStore));
}

export function loadNoteForEvidence(evidenceId: string): string {
  return state.notesStore[evidenceId] || "";
}

export function loadNotesFromStorage(): void {
  // Mirrors loadBookmarksFromStorage's try/catch above: notes are stored as
  // hand-editable localStorage JSON, and this runs unconditionally during
  // initApp before setupEventListeners/loadAllData — an uncaught JSON.parse
  // SyntaxError here (e.g. after a corrupted/hand-edited value) previously
  // aborted the entire app boot, leaving it stuck on the loading overlay
  // with no event listeners ever attached.
  try {
    const raw = localStorage.getItem(STORAGE_KEY_NOTES);
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    state.notesStore =
      parsed && typeof parsed === "object" ? (parsed as Record<string, string>) : {};
  } catch (err) {
    console.warn("Could not read stored notes, starting empty", err);
    state.notesStore = {};
  }
}

export function loadNoteAsync(evidenceId: string): Promise<string> {
  return new Promise(function (resolve) {
    resolve(state.notesStore[evidenceId] || "");
  });
}
