import type { CaseData } from "../../shared/data/CaseDataContext.tsx";
import { CaseDataGate } from "../../shared/data/CaseDataGate.tsx";
import { useBookmarks } from "../../shared/bookmarks/BookmarksContext.tsx";
import { selectBookmarkedEvidence } from "../../shared/bookmarks/selectBookmarkedEvidence.ts";
import {
  applyReviewEdits,
  type ReviewEditsByEvidenceId,
} from "../../shared/evidence/reviewEdits.ts";
import { HowToUseCard } from "./HowToUseCard.tsx";
import { CaseSummaryCard } from "./CaseSummaryCard.tsx";
import { StatGrid } from "./StatGrid.tsx";
import { ReviewProgress } from "./ReviewProgress.tsx";
import { RecentEvidenceList } from "./RecentEvidenceList.tsx";
import { RecentTimelineList } from "./RecentTimelineList.tsx";

const RECENT_ITEM_COUNT = 5;

interface DashboardStateProps {
  reviewEdits: ReviewEditsByEvidenceId;
}

function DashboardContent({ data, reviewEdits }: DashboardStateProps & { data: CaseData }) {
  const { bookmarkedIds } = useBookmarks();
  // Review edits layered over the loaded list, so "Reviewed" and the badges follow the detail panel.
  const evidence = applyReviewEdits(data.evidence, reviewEdits);
  // Derived values are computed during render from the data, not stored in
  // state — there is no second copy that could go out of sync.
  const bookmarkCount = selectBookmarkedEvidence(evidence, bookmarkedIds).length;
  const reviewedCount = evidence.filter(
    (item) => (item.status || "").toLowerCase() === "reviewed",
  ).length;
  const progressPercent =
    evidence.length === 0 ? 0 : Math.round((reviewedCount / evidence.length) * 100);

  const recentEvidence = evidence.slice(-RECENT_ITEM_COUNT).reverse();
  const recentTimeline = data.timeline.slice(-RECENT_ITEM_COUNT).reverse();

  return (
    <>
      <CaseSummaryCard caseInfo={data.caseInfo} />
      <StatGrid
        evidenceCount={evidence.length}
        peopleCount={data.people.length}
        locationCount={data.locations.length}
        bookmarkCount={bookmarkCount}
        reviewedCount={reviewedCount}
      />
      <ReviewProgress progressPercent={progressPercent} />
      <div className="dashboard-columns">
        <RecentEvidenceList items={recentEvidence} />
        <RecentTimelineList events={recentTimeline} />
      </div>
    </>
  );
}

export function DashboardPage(props: DashboardStateProps) {
  return (
    <section className="view active">
      <h2>Case Dashboard</h2>
      <HowToUseCard />
      <CaseDataGate>{(data) => <DashboardContent data={data} {...props} />}</CaseDataGate>
    </section>
  );
}
