// ---------------------------------------------------------------------
// LOCAL STORAGE HELPERS (bookmarks & notes)
// ---------------------------------------------------------------------
// All six functions are used by at least one other module (evidence.js and
// main.js), so all six are named exports — there's no single "entry point"
// here the way there is in dataLoading.js, just a small set of independent
// read/write helpers around localStorage.
import { state, STORAGE_KEY_BOOKMARKS, STORAGE_KEY_NOTES } from "./state.js";

// state.js (Demo 6 converts it) exports `bookmarks: []` and
// `notesStore: {}` with no annotation, so TypeScript's declaration
// inference for the untyped .js source widens them to `never[]` and `{}`
// respectively — types that can hold nothing and can't be indexed by a
// string key. Rather than reach for `any` to silence that, these two
// aliases commit to what these fields actually hold (bookmarks are
// evidence ids; notes are id -> text) and every access below goes through
// an explicit, narrow cast to one of them — Demo 6 replaces both aliases
// with the real domain types once state.js itself is converted.
type BookmarkId = string;
type NotesStore = Record<string, string>;

function notesStore(): NotesStore {
  return state.notesStore as NotesStore;
}

// state.js's inferred `bookmarks: never[]` (see the aliases above) rejects
// *any* array assignment, not just an untyped one — `never[]` is the type
// with no valid elements, so even a correctly-typed `BookmarkId[]` fails
// the assignment. Widening the property to `unknown` through this cast,
// then assigning the properly-typed array into that widened view, is the
// narrowest fix that doesn't reach for `any`.
function setBookmarks(ids: BookmarkId[]): void {
  (state as { bookmarks: unknown }).bookmarks = ids;
}

export function saveBookmarksToStorage(): void {
  localStorage.setItem(STORAGE_KEY_BOOKMARKS, JSON.stringify(state.bookmarks));
}

export function loadBookmarksFromStorage(): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_BOOKMARKS);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    setBookmarks((Array.isArray(parsed) ? parsed : []) as BookmarkId[]);
  } catch (err) {
    console.warn("Could not read stored bookmarks, starting empty", err);
    setBookmarks([]);
  }
}

export function saveNoteForEvidence(evidenceId: string, text: string): void {
  notesStore()[evidenceId] = text;
  localStorage.setItem(STORAGE_KEY_NOTES, JSON.stringify(state.notesStore));
}

export function loadNoteForEvidence(evidenceId: string): string {
  return notesStore()[evidenceId] || "";
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
    state.notesStore = parsed && typeof parsed === "object" ? (parsed as NotesStore) : {};
  } catch (err) {
    console.warn("Could not read stored notes, starting empty", err);
    state.notesStore = {};
  }
}

export function loadNoteAsync(evidenceId: string): Promise<string> {
  return new Promise(function (resolve) {
    resolve(notesStore()[evidenceId] || "");
  });
}
