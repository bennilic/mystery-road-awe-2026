// ---------------------------------------------------------------------
// WORKSPACE VIEW (bookmarks list, notes list, hypothesis form)
// ---------------------------------------------------------------------
import { state, STORAGE_KEY_HYPOTHESIS } from "../state.ts";
import { navigateTo } from "../navigation.ts";
import { openEvidenceDetail } from "./evidence.ts";
import { el } from "../dom.ts";
import type { HypothesisDraft } from "../types.ts";

// Called from navigation.js's handleHashChange — needs to be exported.
export function renderWorkspace(): void {
  renderBookmarksList();
  renderNotesList();
  populateHypothesisDropdowns();
  loadHypothesisFromStorage();
}

// Only called from renderWorkspace in this same file — private.
function renderBookmarksList(): void {
  const container = el<HTMLElement>("bookmarksList");
  if (!container) return;

  const bookmarkedItems = state.allEvidence.filter(function (ev) {
    return ev.bookmarked;
  });

  if (bookmarkedItems.length === 0) {
    container.innerHTML =
      "<p>No bookmarked evidence yet. Bookmark items from the Evidence view.</p>";
    return;
  }

  let html = "";
  for (const ev of bookmarkedItems) {
    html +=
      '<div class="mini-list-item"><strong>' +
      ev.id +
      "</strong> &mdash; " +
      ev.title +
      ' <button type="button" class="btn btn-small btn-secondary" data-open-evidence="' +
      ev.id +
      '">Open</button></div>';
  }
  container.innerHTML = html;

  const openButtons = container.querySelectorAll<HTMLButtonElement>("[data-open-evidence]");
  for (const button of openButtons) {
    button.addEventListener("click", function (e) {
      navigateTo("evidence");
      const id = (e.target as HTMLElement).getAttribute("data-open-evidence")!;
      setTimeout(function () {
        openEvidenceDetail(id);
      }, 0);
    });
  }
}

// Only called from renderWorkspace in this same file — private.
function renderNotesList(): void {
  const container = el<HTMLElement>("notesList");
  if (!container) return;

  interface NoteEntry {
    index: number;
    evidenceId: string;
    title: string;
    text: string;
  }

  const noteEntries: NoteEntry[] = [];
  state.allEvidence.forEach((ev, index) => {
    const note = state.notesStore[ev.id];
    if (note) {
      noteEntries.push({ index, evidenceId: ev.id, title: ev.title, text: note });
    }
  });

  if (noteEntries.length === 0) {
    container.innerHTML = "<p>No notes yet. Add one from an evidence item's detail view.</p>";
    return;
  }

  let html = "";
  for (const entry of noteEntries) {
    html +=
      '<div class="mini-list-item"><strong>' +
      entry.evidenceId +
      "</strong> &mdash; " +
      entry.title;
    html += '<div id="noteText-' + entry.index + '">' + entry.text + "</div></div>"; // unsafe innerHTML rendering, same as the note preview
  }
  container.innerHTML = html;
}

// Called from renderWorkspace (this file) and from dataLoading.js's
// populateAllDropdowns — needs to be exported.
export function populateHypothesisDropdowns(): void {
  const suspectSelect = el<HTMLSelectElement>("hypSuspect");
  const evidenceSelect = el<HTMLSelectElement>("hypEvidence");
  if (!suspectSelect || !evidenceSelect) return;

  const currentSuspect = suspectSelect.value;
  suspectSelect.innerHTML = '<option value="">Select a person…</option>';
  for (const person of state.allPeople) {
    suspectSelect.innerHTML += '<option value="' + person.id + '">' + person.name + "</option>";
  }
  suspectSelect.value = currentSuspect;

  // Same preserve-then-restore treatment as suspectSelect above: this
  // rebuild runs on every Workspace render (renderWorkspace() re-renders
  // unconditionally, e.g. on navigating away and back), and without capturing
  // the current selection first it silently wiped any in-progress, unsaved
  // "Selected supporting evidence" picks while every other hypothesis field
  // (suspect, nature, confidence, explanation, alternative) survived the
  // same re-render untouched.
  const currentEvidenceSelection = getSelectedOptions(evidenceSelect);
  evidenceSelect.innerHTML = "";
  for (const ev of state.allEvidence) {
    evidenceSelect.innerHTML +=
      '<option value="' + ev.id + '">' + ev.id + " - " + ev.title + "</option>";
  }
  for (const option of evidenceSelect.options) {
    option.selected = currentEvidenceSelection.indexOf(option.value) !== -1;
  }
}

// Reached only through the inline onclick="saveHypothesis()" button in
// index.html — exported purely for main.js's window wiring.
export function saveHypothesis(): void {
  const draft: HypothesisDraft = {
    suspectId: el<HTMLSelectElement>("hypSuspect")!.value,
    nature: el<HTMLSelectElement>("hypNature")!.value,
    evidenceIds: getSelectedOptions(el<HTMLSelectElement>("hypEvidence")!),
    confidence: el<HTMLInputElement>("hypConfidence")!.value,
    explanation: el<HTMLTextAreaElement>("hypExplanation")!.value,
    alternative: el<HTMLTextAreaElement>("hypAlternative")!.value,
    savedAt: new Date().toISOString(),
  };

  try {
    localStorage.setItem(STORAGE_KEY_HYPOTHESIS, JSON.stringify(draft));
  } catch (err) {
    console.error("Could not save hypothesis draft", err);
    alert("Your hypothesis could not be saved to local storage.");
    return;
  }

  const msg = el<HTMLElement>("hypothesisSavedMsg")!;
  msg.classList.remove("hidden");
  setTimeout(function () {
    msg.classList.add("hidden");
  }, 2000);
}

// Only called from saveHypothesis in this same file — private.
function getSelectedOptions(selectEl: HTMLSelectElement): string[] {
  const result: string[] = [];
  for (const option of selectEl.options) {
    if (option.selected) result.push(option.value);
  }
  return result;
}

// Only called from renderWorkspace in this same file — private.
function loadHypothesisFromStorage(): void {
  const raw = localStorage.getItem(STORAGE_KEY_HYPOTHESIS);
  if (!raw) return;

  let draft: HypothesisDraft;
  try {
    draft = JSON.parse(raw) as HypothesisDraft;
  } catch (err) {
    // Same class of bug as loadNotesFromStorage in storage.js: an
    // unguarded JSON.parse on hand-editable localStorage. Here it broke a
    // single view (every Workspace render threw before touching the form
    // fields) rather than the whole app, but the fix is the same pattern.
    console.warn("Could not read stored hypothesis draft, ignoring", err);
    return;
  }

  el<HTMLSelectElement>("hypSuspect")!.value = draft.suspectId || "";
  el<HTMLSelectElement>("hypNature")!.value = draft.nature || "";
  el<HTMLInputElement>("hypConfidence")!.value = draft.confidence || "50";
  el<HTMLOutputElement>("hypConfidenceValue")!.textContent = draft.confidence || "50";
  el<HTMLTextAreaElement>("hypExplanation")!.value = draft.explanation || "";
  el<HTMLTextAreaElement>("hypAlternative")!.value = draft.alternative || "";

  const evidenceSelect = el<HTMLSelectElement>("hypEvidence")!;
  const savedIds = draft.evidenceIds || [];
  for (const option of evidenceSelect.options) {
    option.selected = savedIds.indexOf(option.value) !== -1;
  }
}
