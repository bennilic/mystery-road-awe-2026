import { useReducer } from "react";
import { useSearchParams } from "react-router";
import { CaseDataGate } from "../../shared/data/CaseDataGate.tsx";
import type { CaseData } from "../../shared/data/CaseDataContext.tsx";
import { OPEN_EVIDENCE_PARAM } from "../../shared/routing/paths.ts";
import {
  applyReviewEdits,
  type ReviewEdit,
  type ReviewEditsByEvidenceId,
} from "../../shared/evidence/reviewEdits.ts";
import { EvidenceCard } from "./EvidenceCard.tsx";
import { EvidenceDetail } from "./EvidenceDetail.tsx";
import { EvidenceToolbar } from "./EvidenceToolbar.tsx";
import { evidenceFiltersReducer, INITIAL_EVIDENCE_FILTERS } from "./evidenceFiltersReducer.ts";
import { filterAndSortEvidence } from "./filterEvidence.ts";

// The notes and review edits the app owns and the Evidence page only reads or asks to change.
interface EvidenceStateProps {
  notes: Record<string, string>;
  onSaveNote: (evidenceId: string, text: string) => void;
  reviewEdits: ReviewEditsByEvidenceId;
  onChangeReview: (evidenceId: string, change: ReviewEdit) => void;
}

// Feature component: owns the Evidence page's own state (filters, notes, open item)
// and wires events to it; bookmarks come from the app.
function EvidenceContent({
  data,
  notes,
  onSaveNote,
  reviewEdits,
  onChangeReview,
}: EvidenceStateProps & { data: CaseData }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, dispatchFilters] = useReducer(evidenceFiltersReducer, INITIAL_EVIDENCE_FILTERS);
  // The open item lives in the URL only (?open=E01), read here on every render.
  // Copying it into useState gave two sources of truth that drifted apart.
  const selectedEvidenceId = searchParams.get(OPEN_EVIDENCE_PARAM);

  // Review edits are layered over the loaded list on every render.
  const evidence = applyReviewEdits(data.evidence, reviewEdits);

  // Derived on every render from the full list and the filter state: there
  // is no "filtered list" state that could fall out of sync with them.
  const visibleEvidence = filterAndSortEvidence(evidence, filters);

  const selectedItem = evidence.find((item) => item.id === selectedEvidenceId);
  const personName = (personId: string) =>
    data.people.find((person) => person.id === personId)?.name ?? personId;
  const locationLabel = (locationId: string) => {
    const location = data.locations.find((candidate) => candidate.id === locationId);
    return location ? `${location.id} - ${location.name}` : locationId;
  };

  // Loaded fine, but the server holds no evidence at all. Different from
  // "no match for the filters" below, which still shows the toolbar.
  if (data.evidence.length === 0) {
    return (
      <p className="data-state-empty" role="status" data-state="empty">
        No evidence has been recorded for this case yet: the server answered, but its evidence list
        is empty. Reload once evidence has been added.
      </p>
    );
  }

  return (
    <>
      <EvidenceToolbar
        filters={filters}
        onFilterChange={(field, value) => dispatchFilters({ type: "SET_FILTER", field, value })}
        onSortChange={(sortOrder) => dispatchFilters({ type: "SET_SORT", sortOrder })}
        onClear={() => dispatchFilters({ type: "CLEAR_FILTERS" })}
        typeOptions={[...new Set(data.evidence.map((item) => item.type.toLowerCase()))].map(
          (type) => ({ value: type, label: type }),
        )}
        personOptions={data.people.map((person) => ({ value: person.id, label: person.name }))}
        locationOptions={data.locations.map((location) => ({
          value: location.id,
          label: `${location.id} - ${location.name}`,
        }))}
      />
      <div id="evidenceListContainer">
        <div id="evidenceList" className="evidence-grid">
          {visibleEvidence.length === 0 && <p>No evidence matches the current filters.</p>}
          {visibleEvidence.map((item) => (
            <EvidenceCard
              key={item.id}
              item={item}
              onOpen={(evidenceId) => setSearchParams({ [OPEN_EVIDENCE_PARAM]: evidenceId })}
            />
          ))}
        </div>
      </div>
      {selectedEvidenceId && !selectedItem && (
        <p role="status">
          There is no evidence item with the id &quot;{selectedEvidenceId}&quot;. Pick a card from
          the list above.
        </p>
      )}
      {selectedItem && (
        <EvidenceDetail
          item={selectedItem}
          personNames={selectedItem.personIds.map(personName)}
          locationLabels={selectedItem.locationIds.map(locationLabel)}
          savedNote={notes[selectedItem.id] ?? ""}
          onClose={() => setSearchParams({})}
          onSaveNote={onSaveNote}
          onChangeReview={onChangeReview}
        />
      )}
    </>
  );
}

export function EvidencePage(props: EvidenceStateProps) {
  return (
    <section className="view active">
      <h2>Evidence Catalogue</h2>
      <CaseDataGate>{(data) => <EvidenceContent data={data} {...props} />}</CaseDataGate>
    </section>
  );
}
