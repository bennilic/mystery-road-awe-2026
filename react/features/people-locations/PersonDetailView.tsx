import { Link } from "react-router";
import type { Person } from "../../../js/types.ts";
import { PATHS } from "../../shared/routing/paths.ts";
import { Card } from "./Card.tsx";
import { ResponsibilityList } from "./ResponsibilityList.tsx";

interface PersonDetailViewProps {
  person: Person;
  relatedEvidenceCount: number;
}

// Presentational: one person, in full (including the background text the
// list card leaves out).
export function PersonDetailView({ person, relatedEvidenceCount }: PersonDetailViewProps) {
  return (
    <Card variant="person">
      <div className="person-card-header">
        <img className="person-avatar" src={person.avatar} alt={`Portrait of ${person.name}`} />
        <div>
          <h3>{person.name}</h3>
          <div className="person-role">{person.role}</div>
        </div>
      </div>
      <p>
        <strong>Speciality:</strong> {person.speciality}
      </p>
      <p>{person.background}</p>
      <ResponsibilityList responsibilities={person.responsibilities} />
      <div className="person-statement">&ldquo;{person.statement}&rdquo;</div>
      <p>
        {relatedEvidenceCount} related evidence item{relatedEvidenceCount === 1 ? "" : "s"}
      </p>
      <p>
        <Link to={PATHS.people}>&larr; Back to all people</Link>
      </p>
    </Card>
  );
}
