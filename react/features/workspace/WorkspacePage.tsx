import { CaseDataGate } from "../../shared/data/CaseDataGate.tsx";
import type { CaseData } from "../../shared/data/CaseDataContext.tsx";
import { useBookmarks } from "../../shared/bookmarks/BookmarksContext.tsx";
import { selectBookmarkedEvidence } from "../../shared/bookmarks/selectBookmarkedEvidence.ts";
import { BookmarkedEvidenceList } from "./BookmarkedEvidenceList.tsx";
import { HypothesisForm } from "./HypothesisForm.tsx";
import { LivePanel } from "./LivePanel.tsx";
import { NotesList } from "./NotesList.tsx";

interface WorkspaceStateProps {
  notes: Record<string, string>;
}

function WorkspaceContent({ data, notes }: WorkspaceStateProps & { data: CaseData }) {
  const { bookmarkedIds } = useBookmarks();
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

export function WorkspacePage(props: WorkspaceStateProps) {
  return (
    <section className="view active">
      <h2>Investigator Workspace</h2>
      <LivePanel />
      <CaseDataGate>{(data) => <WorkspaceContent data={data} {...props} />}</CaseDataGate>
    </section>
  );
}
