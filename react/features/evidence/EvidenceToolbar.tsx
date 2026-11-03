import type { ChangeEvent } from "react";

export interface FilterOption {
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
      {/* defaultValue (uncontrolled): only the search box is wired so far. */}
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

const STATUS_OPTIONS: FilterOption[] = [
  { value: "unreviewed", label: "Unreviewed" },
  { value: "reviewed", label: "Reviewed" },
  { value: "flagged", label: "Flagged" },
];

const RELEVANCE_OPTIONS: FilterOption[] = [
  { value: "unknown", label: "Unknown" },
  { value: "relevant", label: "Relevant" },
  { value: "irrelevant", label: "Irrelevant" },
];

interface EvidenceToolbarProps {
  searchTerm: string;
  onSearchChange: (event: ChangeEvent<HTMLInputElement>) => void;
  typeOptions: FilterOption[];
  personOptions: FilterOption[];
  locationOptions: FilterOption[];
}

export function EvidenceToolbar({
  searchTerm,
  onSearchChange,
  typeOptions,
  personOptions,
  locationOptions,
}: EvidenceToolbarProps) {
  return (
    <div className="toolbar" id="evidenceToolbar">
      <div className="toolbar-row">
        <label htmlFor="evidenceSearch" className="visually-hidden">
          Search evidence
        </label>
        {/* Controlled: what is shown is always the searchTerm state; typing
            only changes the screen because onChange updates that state. */}
        <input
          type="text"
          id="evidenceSearch"
          placeholder="Search evidence by title, summary, or tag…"
          autoComplete="off"
          value={searchTerm}
          onChange={onSearchChange}
        />
        <FilterSelect
          id="filterType"
          label="Filter by type"
          allLabel="All types"
          options={typeOptions}
        />
        <FilterSelect
          id="filterPerson"
          label="Filter by person"
          allLabel="All people"
          options={personOptions}
        />
        <FilterSelect
          id="filterLocation"
          label="Filter by location"
          allLabel="All locations"
          options={locationOptions}
        />
      </div>
      <div className="toolbar-row">
        <FilterSelect
          id="filterStatus"
          label="Filter by status"
          allLabel="All statuses"
          options={STATUS_OPTIONS}
        />
        <FilterSelect
          id="filterRelevance"
          label="Filter by relevance"
          allLabel="All relevance"
          options={RELEVANCE_OPTIONS}
        />
        <label htmlFor="sortEvidence" className="visually-hidden">
          Sort evidence
        </label>
        <select id="sortEvidence" defaultValue="date-desc">
          <option value="date-desc">Newest first</option>
          <option value="date-asc">Oldest first</option>
          <option value="title-asc">Title (A–Z)</option>
          <option value="title-desc">Title (Z–A)</option>
        </select>
        <button type="button" id="clearFiltersBtn" className="btn btn-secondary">
          Clear filters
        </button>
      </div>
    </div>
  );
}
