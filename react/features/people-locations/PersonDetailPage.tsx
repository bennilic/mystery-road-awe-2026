import { Link, useParams } from "react-router";
import { useCaseData, type CaseData } from "../../shared/data/CaseDataContext.tsx";
import { PATHS } from "../../shared/routing/paths.ts";
import { countEvidenceForPerson } from "./countEvidenceForPerson.ts";
import { PersonDetailView } from "./PersonDetailView.tsx";

function PersonDetailContent({ data, personId }: { data: CaseData; personId: string | undefined }) {
  const person = data.people.find((candidate) => candidate.id === personId);

  // The URL is user input: any string can arrive here, so "no such person" is
  // a normal outcome, not an exception.
  if (!person) {
    return (
      <div className="intro-card">
        <p>
          No person with the id &ldquo;{personId ?? ""}&rdquo; exists in this case. Pick someone
          from the <Link to={PATHS.people}>people list</Link>.
        </p>
      </div>
    );
  }

  return (
    <div className="people-grid">
      <PersonDetailView
        person={person}
        relatedEvidenceCount={countEvidenceForPerson(data.evidence, person)}
      />
    </div>
  );
}

export function PersonDetailPage() {
  // useParams types every param as `string | undefined`: TypeScript cannot know
  // the URL matched a pattern that contains :personId.
  const { personId } = useParams<{ personId: string }>();
  const caseData = useCaseData();

  return (
    <section className="view active">
      <h2>Person profile</h2>
      {caseData.status === "loading" && <p>Loading case file&hellip;</p>}
      {caseData.status === "error" && (
        <p role="alert">
          The case file could not be loaded ({caseData.message}). Check that the dev server is
          running and reload the page.
        </p>
      )}
      {caseData.status === "ready" && (
        <PersonDetailContent data={caseData.data} personId={personId} />
      )}
    </section>
  );
}
