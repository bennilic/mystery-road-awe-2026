import type { Person } from "../../js/types.ts";

interface KeyedPersonListProps {
  people: Person[];
}

// Exercise 4 / Demo 4 — THROWAWAY (now fixed with key={person.id}; the previous
// commit has the key={index} version). Every row owns one piece of state React
// does not track: what was typed into the uncontrolled <input>. That makes
// "which row is this?" visible. Not mounted anywhere in the app.
export function KeyedPersonList({ people }: KeyedPersonListProps) {
  return (
    <ul className="mini-list">
      {people.map((person) => (
        <li className="mini-list-item" key={person.id}>
          <strong>{person.name}</strong>{" "}
          <input type="text" aria-label={`Note about ${person.name}`} />
        </li>
      ))}
    </ul>
  );
}
