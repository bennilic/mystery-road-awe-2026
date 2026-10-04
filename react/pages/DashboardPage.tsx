import { useState } from "react";
import { useCaseData, type CaseData } from "../data/CaseDataContext.tsx";
import { readBookmarkCount } from "../data/bookmarks.ts";
import { HowToUseCard } from "../dashboard/HowToUseCard.tsx";
import { CaseSummaryCard } from "../dashboard/CaseSummaryCard.tsx";
import { StatGrid } from "../dashboard/StatGrid.tsx";
import { ReviewProgress } from "../dashboard/ReviewProgress.tsx";
import { RecentEvidenceList } from "../dashboard/RecentEvidenceList.tsx";
import { RecentTimelineList } from "../dashboard/RecentTimelineList.tsx";

const RECENT_ITEM_COUNT = 5;

function DashboardContent({ data }: { data: CaseData }) {
  // Lazy initializer: runs once per mount. The page unmounts when the user
  // navigates away, so coming back re-reads localStorage and can never show
  // a stale bookmark count.
  const [bookmarkCount] = useState(readBookmarkCount);

  // Derived values are computed during render from the data, not stored in
  // state — there is no second copy that could go out of sync.
  const reviewedCount = data.evidence.filter(
    (item) => (item.status || "").toLowerCase() === "reviewed",
  ).length;
  const progressPercent =
    data.evidence.length === 0 ? 0 : Math.round((reviewedCount / data.evidence.length) * 100);

  const recentEvidence = data.evidence.slice(-RECENT_ITEM_COUNT).reverse();
  const recentTimeline = data.timeline.slice(-RECENT_ITEM_COUNT).reverse();

  return (
    <>
      <CaseSummaryCard caseInfo={data.caseInfo} />
      <StatGrid
        evidenceCount={data.evidence.length}
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

export function DashboardPage() {
  const caseData = useCaseData();

  return (
    <section className="view active">
      <h2>Case Dashboard</h2>
      <HowToUseCard />
      {caseData.status === "loading" && <p>Loading case file&hellip;</p>}
      {caseData.status === "error" && (
        <p role="alert">
          The case file could not be loaded ({caseData.message}). Check that the dev server is
          running and reload the page.
        </p>
      )}
      {caseData.status === "ready" && <DashboardContent data={caseData.data} />}
    </section>
  );
}
