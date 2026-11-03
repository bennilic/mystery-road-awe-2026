import { useState } from "react";
import { CaseDataGate } from "../../shared/data/CaseDataGate.tsx";
import type { CaseData } from "../../shared/data/CaseDataContext.tsx";
import { selectBookmarkedEvidence } from "../../shared/bookmarks/selectBookmarkedEvidence.ts";
import { readNotes } from "../../shared/storage/noteStorage.ts";
import { BookmarkedEvidenceList } from "./BookmarkedEvidenceList.tsx";
import { HypothesisForm } from "./HypothesisForm.tsx";
import { NotesList } from "./NotesList.tsx";

function WorkspaceContent({ data, bookmarkedIds }: { data: CaseData; bookmarkedIds: string[] }) {
  // Notes are still read once per visit; they move up in Demo 6.
  const [notes] = useState(readNotes);

  const bookmarkedItems = selectBookmarkedEvidence(data.evidence, bookmarkedIds);

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

export function WorkspacePage({ bookmarkedIds }: { bookmarkedIds: string[] }) {
  return (
    <section className="view active">
      <h2>Investigator Workspace</h2>
      <CaseDataGate>
        {(data) => <WorkspaceContent data={data} bookmarkedIds={bookmarkedIds} />}
      </CaseDataGate>
    </section>
  );
}
