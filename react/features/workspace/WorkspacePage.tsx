import { useState } from "react";
import { CaseDataGate } from "../../shared/data/CaseDataGate.tsx";
import type { CaseData } from "../../shared/data/CaseDataContext.tsx";
import { selectBookmarkedEvidence } from "../../shared/bookmarks/selectBookmarkedEvidence.ts";
import { readBookmarkIds } from "../../shared/storage/bookmarkStorage.ts";
import { readNotes } from "../../shared/storage/noteStorage.ts";
import { BookmarkedEvidenceList } from "./BookmarkedEvidenceList.tsx";
import { HypothesisForm } from "./HypothesisForm.tsx";
import { NotesList } from "./NotesList.tsx";

function WorkspaceContent({ data }: { data: CaseData }) {
  // Read once per visit (the page unmounts when you leave it).
  const [bookmarkIds] = useState(readBookmarkIds);
  const [notes] = useState(readNotes);

  const bookmarkedItems = selectBookmarkedEvidence(data.evidence, bookmarkIds);

  return (
    <>
      <div className="workspace-grid">
        <div className="workspace-col">
          <h3>Bookmarked Evidence</h3>
          <BookmarkedEvidenceList items={bookmarkedItems} />
        </div>
        <div className="workspace-col">
          <h3>Personal Notes</h3>
          <p className="hint-text">
            Notes are attached to whichever evidence item is currently open in the Evidence view.
          </p>
          <NotesList items={data.evidence} notes={notes} />
        </div>
      </div>
      <HypothesisForm people={data.people} evidence={data.evidence} />
    </>
  );
}

export function WorkspacePage() {
  return (
    <section className="view active">
      <h2>Investigator Workspace</h2>
      <CaseDataGate>{(data) => <WorkspaceContent data={data} />}</CaseDataGate>
    </section>
  );
}
