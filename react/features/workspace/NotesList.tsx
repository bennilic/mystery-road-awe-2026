import type { Evidence } from "../../../js/types.ts";

interface NotesListProps {
  items: Evidence[];
  notes: Record<string, string>;
}

// Shows the evidence items that have a non-empty note, in evidence order.
export function NotesList({ items, notes }: NotesListProps) {
  const itemsWithNotes = items.filter((item) => notes[item.id]);

  return (
    <div id="notesList" className="notes-list">
      {itemsWithNotes.length === 0 && (
        <p>No notes yet. Add one from an evidence item&apos;s detail view.</p>
      )}
      {itemsWithNotes.map((item) => (
        // key is the evidence id, not the array index the vanilla version used.
        <div className="mini-list-item" key={item.id}>
          <strong>{item.id}</strong> &mdash; {item.title}
          {/* Rendered as text: a note containing <b> shows the characters, it cannot inject markup. */}
          <div>{notes[item.id]}</div>
        </div>
      ))}
    </div>
  );
}
