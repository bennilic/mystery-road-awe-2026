import { STORAGE_KEY_NOTES } from "../../../js/state.ts";

// evidence id -> note text. Same key and shape as the vanilla app.
export type NotesByEvidenceId = Record<string, string>;

export function readNotes(): NotesByEvidenceId {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_NOTES);
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return parsed as NotesByEvidenceId;
  } catch (error) {
    console.warn("Could not read stored notes, starting with none", error);
    return {};
  }
}

// Throws if the browser refuses the write; see writeBookmarkIds.
export function writeNotes(notes: NotesByEvidenceId): void {
  localStorage.setItem(STORAGE_KEY_NOTES, JSON.stringify(notes));
}
