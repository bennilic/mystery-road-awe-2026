import type { Person } from "../../js/types.ts";

interface KeyedPersonListProps {
  people: Person[];
}

// Exercise 4 / Demo 4 — THROWAWAY. Every row owns one piece of state React
// does not track: what was typed into the uncontrolled <input>. That makes
// "which row is this?" visible. Not mounted anywhere in the app.
export function KeyedPersonList({ people }: KeyedPersonListProps) {
  return (
    <ul className="mini-list">
      {people.map((person, index) => (
        <li className="mini-list-item" key={index}>
          <strong>{person.name}</strong>{" "}
          <input type="text" aria-label={`Note about ${person.name}`} />
        </li>
      ))}
    </ul>
  );
}
