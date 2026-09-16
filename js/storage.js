// ---------------------------------------------------------------------
// LOCAL STORAGE HELPERS (bookmarks & notes)
// ---------------------------------------------------------------------
// All six functions are used by at least one other module (evidence.js and
// main.js), so all six are named exports — there's no single "entry point"
// here the way there is in dataLoading.js, just a small set of independent
// read/write helpers around localStorage.
import { state, STORAGE_KEY_BOOKMARKS, STORAGE_KEY_NOTES } from "./state.js";

export function saveBookmarksToStorage() {
  localStorage.setItem(STORAGE_KEY_BOOKMARKS, JSON.stringify(state.bookmarks));
}

export function loadBookmarksFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_BOOKMARKS);
    const parsed = raw ? JSON.parse(raw) : [];
    state.bookmarks = Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn("Could not read stored bookmarks, starting empty", err);
    state.bookmarks = [];
  }
}

export function saveNoteForEvidence(evidenceId, text) {
  state.notesStore[evidenceId] = text;
  localStorage.setItem(STORAGE_KEY_NOTES, JSON.stringify(state.notesStore));
}

export function loadNoteForEvidence(evidenceId) {
  return state.notesStore[evidenceId] || "";
}

export function loadNotesFromStorage() {
  // Mirrors loadBookmarksFromStorage's try/catch above: notes are stored as
  // hand-editable localStorage JSON, and this runs unconditionally during
  // initApp before setupEventListeners/loadAllData — an uncaught JSON.parse
  // SyntaxError here (e.g. after a corrupted/hand-edited value) previously
  // aborted the entire app boot, leaving it stuck on the loading overlay
  // with no event listeners ever attached.
  try {
    const raw = localStorage.getItem(STORAGE_KEY_NOTES);
    const parsed = raw ? JSON.parse(raw) : {};
    state.notesStore = parsed && typeof parsed === "object" ? parsed : {};
  } catch (err) {
    console.warn("Could not read stored notes, starting empty", err);
    state.notesStore = {};
  }
}

export function loadNoteAsync(evidenceId) {
  return new Promise(function (resolve) {
    resolve(state.notesStore[evidenceId] || "");
  });
}
