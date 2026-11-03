import type { Person } from "../../../js/types.ts";
import { Card } from "./Card.tsx";
import { ResponsibilityList } from "./ResponsibilityList.tsx";

interface PersonCardProps {
  person: Person;
  relatedEvidenceCount: number;
}

export function PersonCard({ person, relatedEvidenceCount }: PersonCardProps) {
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
      <ResponsibilityList responsibilities={person.responsibilities} />
      <div className="person-statement">&ldquo;{person.statement}&rdquo;</div>
      <p>
        {relatedEvidenceCount} related evidence item{relatedEvidenceCount === 1 ? "" : "s"}
      </p>
    </Card>
  );
}
