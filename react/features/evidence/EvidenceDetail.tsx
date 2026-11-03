import type { FormEvent } from "react";
import { formatDate } from "../../../js/lookup.ts";
import type { Evidence } from "../../../js/types.ts";

interface EvidenceDetailProps {
  item: Evidence;
  personNames: string[];
  locationLabels: string[];
  savedNote: string;
  onClose: () => void;
  onSaveNote: (evidenceId: string, text: string) => void;
}

// Presentational: everything arrives as props; the only thing it owns is the
// DOM state of its uncontrolled note field.
export function EvidenceDetail({
  item,
  personNames,
  locationLabels,
  savedNote,
  onClose,
  onSaveNote,
}: EvidenceDetailProps) {
  function handleNoteSubmit(event: FormEvent<HTMLFormElement>) {
    // Without this the browser would submit the form and reload the page.
    event.preventDefault();
    const noteText = new FormData(event.currentTarget).get("note");
    onSaveNote(item.id, typeof noteText === "string" ? noteText : "");
  }

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
        <select id="detailStatusSelect" defaultValue={item.status.toLowerCase()}>
          <option value="unreviewed">Unreviewed</option>
          <option value="reviewed">Reviewed</option>
          <option value="flagged">Flagged</option>
        </select>
      </div>
      <div className="detail-field">
        <strong>Relevance</strong>
        <select id="detailRelevanceSelect" defaultValue={item.relevance.toLowerCase()}>
          <option value="unknown">Unknown</option>
          <option value="relevant">Relevant</option>
          <option value="irrelevant">Irrelevant</option>
        </select>
      </div>

      <form className="detail-field" onSubmit={handleNoteSubmit}>
        <strong>Investigator note</strong>
        {/* key: the textarea is uncontrolled, so a different item must remount it. */}
        <textarea
          key={item.id}
          id="evidenceNoteInput"
          name="note"
          className="note-textarea"
          rows={3}
          placeholder="Add a private note about this evidence..."
          defaultValue={savedNote}
        />
        <button type="submit" className="btn btn-primary btn-small" style={{ marginTop: 6 }}>
          Save note
        </button>
      </form>

      <div className="detail-field">
        <strong>Note preview</strong>
        <div id="notePreview">{savedNote}</div>
      </div>
    </div>
  );
}
