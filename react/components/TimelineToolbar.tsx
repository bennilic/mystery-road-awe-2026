interface FilterOption {
  value: string;
  label: string;
}

interface FilterSelectProps {
  id: string;
  label: string;
  allLabel: string;
  options: FilterOption[];
}

function FilterSelect({ id, label, allLabel, options }: FilterSelectProps) {
  return (
    <>
      <label htmlFor={id} className="visually-hidden">
        {label}
      </label>
      {/* defaultValue (uncontrolled) on purpose: the controls are visually
          complete but not wired to anything until Exercise 5. */}
      <select id={id} defaultValue="">
        <option value="">{allLabel}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </>
  );
}

interface TimelineToolbarProps {
  personOptions: FilterOption[];
  locationOptions: FilterOption[];
  typeOptions: FilterOption[];
}

export function TimelineToolbar({
  personOptions,
  locationOptions,
  typeOptions,
}: TimelineToolbarProps) {
  return (
    <div className="toolbar" id="timelineToolbar">
      <div className="toolbar-row">
        <label htmlFor="timelineOrder" className="visually-hidden">
          Order
        </label>
        <select id="timelineOrder" defaultValue="asc">
          <option value="asc">Oldest first</option>
          <option value="desc">Newest first</option>
        </select>
        <FilterSelect
          id="timelinePersonFilter"
          label="Filter by person"
          allLabel="All people"
          options={personOptions}
        />
        <FilterSelect
          id="timelineLocationFilter"
          label="Filter by location"
          allLabel="All locations"
          options={locationOptions}
        />
        <FilterSelect
          id="timelineTypeFilter"
          label="Filter by event type"
          allLabel="All event types"
          options={typeOptions}
        />
      </div>
    </div>
  );
}
