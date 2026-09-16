// ---------------------------------------------------------------------
// WORKSPACE VIEW (bookmarks list, notes list, hypothesis form)
// ---------------------------------------------------------------------
import { state, STORAGE_KEY_HYPOTHESIS } from "../state.js";
import { navigateTo } from "../navigation.js";
import { openEvidenceDetail } from "./evidence.js";

// Called from navigation.js's handleHashChange — needs to be exported.
export function renderWorkspace() {
  renderBookmarksList();
  renderNotesList();
  populateHypothesisDropdowns();
  loadHypothesisFromStorage();
}

// Only called from renderWorkspace in this same file — private.
function renderBookmarksList() {
  const container = document.getElementById("bookmarksList");
  if (!container) return;

  const bookmarkedItems = state.allEvidence.filter(function (ev) {
    return ev.bookmarked;
  });

  if (bookmarkedItems.length === 0) {
    container.innerHTML = "<p>No bookmarked evidence yet. Bookmark items from the Evidence view.</p>";
    return;
  }

  let html = "";
  for (let i = 0; i < bookmarkedItems.length; i++) {
    const ev = bookmarkedItems[i];
    html += '<div class="mini-list-item"><strong>' + ev.id + "</strong> &mdash; " + ev.title +
      ' <button type="button" class="btn btn-small btn-secondary" data-open-evidence="' + ev.id + '">Open</button></div>';
  }
  container.innerHTML = html;

  const openButtons = container.querySelectorAll("[data-open-evidence]");
  for (let b = 0; b < openButtons.length; b++) {
    openButtons[b].addEventListener("click", function (e) {
      navigateTo("evidence");
      const id = e.target.getAttribute("data-open-evidence");
      setTimeout(function () {
        openEvidenceDetail(id);
      }, 0);
    });
  }
}

// Only called from renderWorkspace in this same file — private.
function renderNotesList() {
  const container = document.getElementById("notesList");
  if (!container) return;

  const noteEntries = [];
  for (let i = 0; i < state.allEvidence.length; i++) {
    const note = state.notesStore[state.allEvidence[i].id];
    if (note) {
      noteEntries.push({ index: i, evidenceId: state.allEvidence[i].id, title: state.allEvidence[i].title, text: note });
    }
  }

  if (noteEntries.length === 0) {
    container.innerHTML = "<p>No notes yet. Add one from an evidence item's detail view.</p>";
    return;
  }

  let html = "";
  for (let n = 0; n < noteEntries.length; n++) {
    const entry = noteEntries[n];
    html += '<div class="mini-list-item"><strong>' + entry.evidenceId + "</strong> &mdash; " + entry.title;
    html += '<div id="noteText-' + entry.index + '">' + entry.text + "</div></div>"; // unsafe innerHTML rendering, same as the note preview
  }
  container.innerHTML = html;
}

// Called from renderWorkspace (this file) and from dataLoading.js's
// populateAllDropdowns — needs to be exported.
export function populateHypothesisDropdowns() {
  const suspectSelect = document.getElementById("hypSuspect");
  const evidenceSelect = document.getElementById("hypEvidence");
  if (!suspectSelect || !evidenceSelect) return;

  const currentSuspect = suspectSelect.value;
  suspectSelect.innerHTML = '<option value="">Select a person…</option>';
  for (let p = 0; p < state.allPeople.length; p++) {
    suspectSelect.innerHTML += '<option value="' + state.allPeople[p].id + '">' + state.allPeople[p].name + "</option>";
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
  for (let i = 0; i < state.allEvidence.length; i++) {
    evidenceSelect.innerHTML += '<option value="' + state.allEvidence[i].id + '">' + state.allEvidence[i].id + " - " + state.allEvidence[i].title + "</option>";
  }
  for (let o = 0; o < evidenceSelect.options.length; o++) {
    evidenceSelect.options[o].selected = currentEvidenceSelection.indexOf(evidenceSelect.options[o].value) !== -1;
  }
}

// Reached only through the inline onclick="saveHypothesis()" button in
// index.html — exported purely for main.js's window wiring.
export function saveHypothesis() {
  const draft = {
    suspectId: document.getElementById("hypSuspect").value,
    nature: document.getElementById("hypNature").value,
    evidenceIds: getSelectedOptions(document.getElementById("hypEvidence")),
    confidence: document.getElementById("hypConfidence").value,
    explanation: document.getElementById("hypExplanation").value,
    alternative: document.getElementById("hypAlternative").value,
    savedAt: new Date().toISOString()
  };

  try {
    localStorage.setItem(STORAGE_KEY_HYPOTHESIS, JSON.stringify(draft));
  } catch (err) {
    console.error("Could not save hypothesis draft", err);
    alert("Your hypothesis could not be saved to local storage.");
    return;
  }

  const msg = document.getElementById("hypothesisSavedMsg");
  msg.classList.remove("hidden");
  setTimeout(function () {
    msg.classList.add("hidden");
  }, 2000);
}

// Only called from saveHypothesis in this same file — private.
function getSelectedOptions(selectEl) {
  const result = [];
  for (let i = 0; i < selectEl.options.length; i++) {
    if (selectEl.options[i].selected) result.push(selectEl.options[i].value);
  }
  return result;
}

// Only called from renderWorkspace in this same file — private.
function loadHypothesisFromStorage() {
  const raw = localStorage.getItem(STORAGE_KEY_HYPOTHESIS);
  if (!raw) return;

  let draft;
  try {
    draft = JSON.parse(raw);
  } catch (err) {
    // Same class of bug as loadNotesFromStorage in storage.js: an
    // unguarded JSON.parse on hand-editable localStorage. Here it broke a
    // single view (every Workspace render threw before touching the form
    // fields) rather than the whole app, but the fix is the same pattern.
    console.warn("Could not read stored hypothesis draft, ignoring", err);
    return;
  }

  document.getElementById("hypSuspect").value = draft.suspectId || "";
  document.getElementById("hypNature").value = draft.nature || "";
  document.getElementById("hypConfidence").value = draft.confidence || 50;
  document.getElementById("hypConfidenceValue").textContent = draft.confidence || 50;
  document.getElementById("hypExplanation").value = draft.explanation || "";
  document.getElementById("hypAlternative").value = draft.alternative || "";

  const evidenceSelect = document.getElementById("hypEvidence");
  const savedIds = draft.evidenceIds || [];
  for (let i = 0; i < evidenceSelect.options.length; i++) {
    evidenceSelect.options[i].selected = savedIds.indexOf(evidenceSelect.options[i].value) !== -1;
  }
}
