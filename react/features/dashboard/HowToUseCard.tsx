import { Link } from "react-router";
import { PATHS } from "../../shared/routing/paths.ts";

interface HowToItem {
  heading: string;
  text: string;
  target: string;
  buttonLabel: string;
}

const HOW_TO_ITEMS: HowToItem[] = [
  {
    heading: "1. Evidence Catalogue",
    text: "Search, filter, and sort every evidence item. Open one for full details, related people and locations, and to add a private note.",
    target: PATHS.evidence,
    buttonLabel: "Go to Evidence",
  },
  {
    heading: "2. People & Locations",
    text: "Read profiles and statements from the six team members involved, and look up the six key locations in the investigation.",
    target: PATHS.people,
    buttonLabel: "Go to People & Locations",
  },
  {
    heading: "3. Timeline",
    text: "Walk through events in chronological order, filter by person, location, or type, and jump straight to the evidence behind any event.",
    target: PATHS.timeline,
    buttonLabel: "Go to Timeline",
  },
  {
    heading: "4. Investigator Workspace",
    text: "Your bookmarked evidence and notes collect here. Draft a hypothesis — who you suspect, why, and how confident you are — it's saved automatically in your browser.",
    target: PATHS.workspace,
    buttonLabel: "Go to Workspace",
  },
];

export function HowToUseCard() {
  return (
    <div className="intro-card">
      <h3>How to use this portal</h3>
      <p>
        Everything gathered on the case so far is organised into four working views. Use the
        navigation bar at the top to move between them at any time.
      </p>
      <div className="howto-grid">
        {HOW_TO_ITEMS.map((item) => (
          <div className="howto-item" key={item.target}>
            <h4>{item.heading}</h4>
            <p>{item.text}</p>
            <Link className="btn btn-secondary btn-small" to={item.target}>
              {item.buttonLabel}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
