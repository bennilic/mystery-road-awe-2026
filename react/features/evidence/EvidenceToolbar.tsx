import type { EvidenceFilters, SortOrder } from "./filterEvidence.ts";

export interface FilterOption {
  value: string;
  label: string;
}

// The text/dropdown filters; the sort order has its own typed handler.
export type FilterField = Exclude<keyof EvidenceFilters, "sortOrder">;

interface FilterSelectProps {
  id: string;
  label: string;
  allLabel: string;
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
}

function FilterSelect({ id, label, allLabel, options, value, onChange }: FilterSelectProps) {
  return (
    <>
      <label htmlFor={id} className="visually-hidden">
        {label}
      </label>
      <select id={id} value={value} onChange={(event) => onChange(event.target.value)}>
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

const SORT_OPTIONS: Array<{ value: SortOrder; label: string }> = [
  { value: "date-desc", label: "Newest first" },
  { value: "date-asc", label: "Oldest first" },
  { value: "title-asc", label: "Title (A–Z)" },
  { value: "title-desc", label: "Title (Z–A)" },
];

function isSortOrder(value: string): value is SortOrder {
  return SORT_OPTIONS.some((option) => option.value === value);
}

interface EvidenceToolbarProps {
  filters: EvidenceFilters;
  onFilterChange: (field: FilterField, value: string) => void;
  onSortChange: (sortOrder: SortOrder) => void;
  onClear: () => void;
  typeOptions: FilterOption[];
  personOptions: FilterOption[];
  locationOptions: FilterOption[];
}

export function EvidenceToolbar({
  filters,
  onFilterChange,
  onSortChange,
  onClear,
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
          value={filters.searchTerm}
          onChange={(event) => onFilterChange("searchTerm", event.target.value)}
        />
        <FilterSelect
          id="filterType"
          label="Filter by type"
          allLabel="All types"
          options={typeOptions}
          value={filters.type}
          onChange={(value) => onFilterChange("type", value)}
        />
        <FilterSelect
          id="filterPerson"
          label="Filter by person"
          allLabel="All people"
          options={personOptions}
          value={filters.personId}
          onChange={(value) => onFilterChange("personId", value)}
        />
        <FilterSelect
          id="filterLocation"
          label="Filter by location"
          allLabel="All locations"
          options={locationOptions}
          value={filters.locationId}
          onChange={(value) => onFilterChange("locationId", value)}
        />
      </div>
      <div className="toolbar-row">
        <FilterSelect
          id="filterStatus"
          label="Filter by status"
          allLabel="All statuses"
          options={STATUS_OPTIONS}
          value={filters.status}
          onChange={(value) => onFilterChange("status", value)}
        />
        <FilterSelect
          id="filterRelevance"
          label="Filter by relevance"
          allLabel="All relevance"
          options={RELEVANCE_OPTIONS}
          value={filters.relevance}
          onChange={(value) => onFilterChange("relevance", value)}
        />
        <label htmlFor="sortEvidence" className="visually-hidden">
          Sort evidence
        </label>
        <select
          id="sortEvidence"
          value={filters.sortOrder}
          onChange={(event) => {
            if (isSortOrder(event.target.value)) onSortChange(event.target.value);
          }}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <button type="button" id="clearFiltersBtn" className="btn btn-secondary" onClick={onClear}>
          Clear filters
        </button>
      </div>
    </div>
  );
}
