import { useEffect, useState, type FormEvent } from "react";
import { formatDate } from "../../../js/lookup.ts";
import type { ReviewEdit } from "../../shared/evidence/reviewEdits.ts";
import type { Evidence, EvidenceRelevance, EvidenceStatus } from "../../../js/types.ts";

interface EvidenceDetailProps {
  item: Evidence;
  personNames: string[];
  locationLabels: string[];
  savedNote: string;
  onClose: () => void;
  onSaveNote: (evidenceId: string, text: string) => void;
  onChangeReview: (evidenceId: string, change: ReviewEdit) => void;
}

function isEvidenceStatus(value: string): value is EvidenceStatus {
  return value === "unreviewed" || value === "reviewed" || value === "flagged";
}

function isEvidenceRelevance(value: string): value is EvidenceRelevance {
  return value === "unknown" || value === "relevant" || value === "irrelevant";
}

// Presentational: everything arrives as props.
interface NoteEditorProps {
  evidenceId: string;
  savedNote: string;
  onSaveNote: (evidenceId: string, text: string) => void;
}

// The draft is its own state on purpose: it differs from the saved note until
// Save is pressed, and the preview shows only what was saved.
function NoteEditor({ evidenceId, savedNote, onSaveNote }: NoteEditorProps) {
  const [draft, setDraft] = useState(savedNote);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    // Without this the browser would submit the form and reload the page.
    event.preventDefault();
    onSaveNote(evidenceId, draft);
  }

  return (
    <form className="detail-field" onSubmit={handleSubmit}>
      <strong>Investigator note</strong>
      <textarea
        id="evidenceNoteInput"
        className="note-textarea"
        rows={3}
        placeholder="Add a private note about this evidence..."
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
      />
      <button type="submit" className="btn btn-primary btn-small" style={{ marginTop: 6 }}>
        Save note
      </button>
    </form>
  );
}

export function EvidenceDetail({
  item,
  personNames,
  locationLabels,
  savedNote,
  onClose,
  onSaveNote,
  onChangeReview,
}: EvidenceDetailProps) {
  // Esc closes the panel. The listener lives on window, outside React, so it
  // must be removed when the panel closes or onClose changes; otherwise Esc
  // would keep calling a stale onClose on other pages.
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="evidence-detail" id="evidenceDetailSection">
      <div className="evidence-detail-header">
        <div>
          <h2>{item.title}</h2>
          <div className="evidence-meta">
            {item.id} &middot; {item.type} &middot; {formatDate(item.timestamp)}
          </div>
        </div>
        <button type="button" className="btn btn-secondary btn-small" onClick={onClose}>
          Close
        </button>
      </div>

      {item.tags.includes("critical") && (
        <div className="warning-banner">This item is tagged as critical evidence.</div>
      )}

      <div className="detail-field">
        <strong>Summary</strong>
        {item.summary}
      </div>
      <div className="evidence-detail-content">{item.content}</div>
      <div className="detail-field">
        <strong>Related people</strong>
        {personNames.join(", ")}
      </div>
      <div className="detail-field">
        <strong>Related locations</strong>
        {locationLabels.join(", ")}
      </div>
      <div className="detail-field">
        <strong>Tags</strong>
        {item.tags.map((tag) => (
          <span className="tag-chip" key={tag}>
            {tag}
          </span>
        ))}
      </div>

      <div className="detail-field">
        <strong>Review status</strong>
        <select
          id="detailStatusSelect"
          value={item.status.toLowerCase()}
          onChange={(event) => {
            if (isEvidenceStatus(event.target.value)) {
              onChangeReview(item.id, { status: event.target.value });
            }
          }}
        >
          <option value="unreviewed">Unreviewed</option>
          <option value="reviewed">Reviewed</option>
          <option value="flagged">Flagged</option>
        </select>
      </div>
      <div className="detail-field">
        <strong>Relevance</strong>
        <select
          id="detailRelevanceSelect"
          value={item.relevance.toLowerCase()}
          onChange={(event) => {
            if (isEvidenceRelevance(event.target.value)) {
              onChangeReview(item.id, { relevance: event.target.value });
            }
          }}
        >
          <option value="unknown">Unknown</option>
          <option value="relevant">Relevant</option>
          <option value="irrelevant">Irrelevant</option>
        </select>
      </div>

      {/* key: a different item starts with its own draft. */}
      <NoteEditor
        key={item.id}
        evidenceId={item.id}
        savedNote={savedNote}
        onSaveNote={onSaveNote}
      />

      <div className="detail-field">
        <strong>Note preview</strong>
        <div id="notePreview">{savedNote}</div>
      </div>
    </div>
  );
}
