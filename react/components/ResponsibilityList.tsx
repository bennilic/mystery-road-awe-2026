interface ResponsibilityListProps {
  responsibilities: string[];
}

export function ResponsibilityList({ responsibilities }: ResponsibilityListProps) {
  // Early return of null: render nothing at all, not an empty <ul> that would
  // still add list margins and an empty list to the DOM.
  if (responsibilities.length === 0) return null;

  return (
    <ul>
      {responsibilities.map((responsibility) => (
        <li key={responsibility}>{responsibility}</li>
      ))}
    </ul>
  );
}
