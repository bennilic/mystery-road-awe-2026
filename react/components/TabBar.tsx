export type PeopleTab = "people" | "locations";

// Lookup technique: label text is data keyed by the tab id, so adding a third
// tab is one new entry (and the Record type forces it) instead of another branch.
const TAB_LABELS: Record<PeopleTab, string> = {
  people: "People",
  locations: "Locations",
};

interface TabBarProps {
  activeTab: PeopleTab;
}

// Visually complete, deliberately not interactive: switching tabs becomes a
// real route in Demo 8, not a click handler with state.
export function TabBar({ activeTab }: TabBarProps) {
  const tabs: PeopleTab[] = ["people", "locations"];

  return (
    <div className="tab-bar">
      {tabs.map((tab) => (
        <button
          key={tab}
          type="button"
          // Ternary: exactly two outcomes (active or not) for one attribute.
          className={tab === activeTab ? "tab-btn active" : "tab-btn"}
        >
          {TAB_LABELS[tab]}
        </button>
      ))}
    </div>
  );
}
