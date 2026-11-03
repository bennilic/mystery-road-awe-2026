import { useState } from "react";
import { useSearchParams } from "react-router";
import { CaseDataGate } from "../../shared/data/CaseDataGate.tsx";
import type { CaseData } from "../../shared/data/CaseDataContext.tsx";
import { OPEN_EVIDENCE_PARAM } from "../../shared/routing/paths.ts";
import { readNotes, writeNotes } from "../../shared/storage/noteStorage.ts";
import { describeStorageFailure } from "../../shared/storage/describeStorageFailure.ts";
import { EvidenceCard } from "./EvidenceCard.tsx";
import { EvidenceDetail } from "./EvidenceDetail.tsx";
import { EvidenceToolbar, type FilterField } from "./EvidenceToolbar.tsx";
import { filterAndSortEvidence, type SortOrder } from "./filterEvidence.ts";

interface BookmarkProps {
  bookmarkedIds: string[];
  onToggleBookmark: (evidenceId: string) => void;
}

// Feature component: owns the Evidence page's own state (filters, notes, open item)
// and wires events to it; bookmarks come from the app.
function EvidenceContent({
  data,
  bookmarkedIds,
  onToggleBookmark,
}: BookmarkProps & { data: CaseData }) {
  const [searchParams] = useSearchParams();
  const [notes, setNotes] = useState(readNotes);
  const [searchTerm, setSearchTerm] = useState("");
  const [type, setType] = useState("");
  const [personId, setPersonId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [status, setStatus] = useState("");
  const [relevance, setRelevance] = useState("");
  const [sortOrder, setSortOrder] = useState<SortOrder>("date-desc");
  const [selectedEvidenceId, setSelectedEvidenceId] = useState<string | null>(() =>
    searchParams.get(OPEN_EVIDENCE_PARAM),
  );
  const [storageNotice, setStorageNotice] = useState<string | null>(null);

  function handleFilterChange(field: FilterField, value: string) {
    switch (field) {
      case "searchTerm":
        return setSearchTerm(value);
      case "type":
        return setType(value);
      case "personId":
        return setPersonId(value);
      case "locationId":
        return setLocationId(value);
      case "status":
        return setStatus(value);
      case "relevance":
        return setRelevance(value);
    }
  }

  // One setter per field: forgetting one here leaves that filter active.
  function handleClearFilters() {
    setSearchTerm("");
    setType("");
    setPersonId("");
    setLocationId("");
    setStatus("");
    setRelevance("");
    setSortOrder("date-desc");
  }

  function handleSaveNote(evidenceId: string, text: string) {
    const nextNotes = { ...notes, [evidenceId]: text };
    setNotes(nextNotes);
    try {
      writeNotes(nextNotes);
    } catch (error) {
      setStorageNotice(describeStorageFailure("Your note", error));
    }
  }

  // Derived on every render from the full list and the filter state: there
  // is no "filtered list" state that could fall out of sync with them.
  const visibleEvidence = filterAndSortEvidence(data.evidence, {
    searchTerm,
    type,
    personId,
    locationId,
    status,
    relevance,
    sortOrder,
  });

  const selectedItem = data.evidence.find((item) => item.id === selectedEvidenceId);
  const personName = (personId: string) =>
    data.people.find((person) => person.id === personId)?.name ?? personId;
  const locationLabel = (locationId: string) => {
    const location = data.locations.find((candidate) => candidate.id === locationId);
    return location ? `${location.id} - ${location.name}` : locationId;
  };

  return (
    <>
      <EvidenceToolbar
        filters={{ searchTerm, type, personId, locationId, status, relevance, sortOrder }}
        onFilterChange={handleFilterChange}
        onSortChange={setSortOrder}
        onClear={handleClearFilters}
        typeOptions={[...new Set(data.evidence.map((item) => item.type.toLowerCase()))].map(
          (type) => ({ value: type, label: type }),
        )}
        personOptions={data.people.map((person) => ({ value: person.id, label: person.name }))}
        locationOptions={data.locations.map((location) => ({
          value: location.id,
          label: `${location.id} - ${location.name}`,
        }))}
      />
      {storageNotice && <p role="alert">{storageNotice}</p>}
      <div id="evidenceListContainer">
        <div id="evidenceList" className="evidence-grid">
          {visibleEvidence.length === 0 && <p>No evidence matches the current filters.</p>}
          {visibleEvidence.map((item) => (
            <EvidenceCard
              key={item.id}
              item={item}
              isBookmarked={bookmarkedIds.includes(item.id)}
              onOpen={setSelectedEvidenceId}
              onToggleBookmark={onToggleBookmark}
            />
          ))}
        </div>
      </div>
      {selectedItem && (
        <EvidenceDetail
          item={selectedItem}
          personNames={selectedItem.personIds.map(personName)}
          locationLabels={selectedItem.locationIds.map(locationLabel)}
          savedNote={notes[selectedItem.id] ?? ""}
          onClose={() => setSelectedEvidenceId(null)}
          onSaveNote={handleSaveNote}
        />
      )}
    </>
  );
}

export function EvidencePage(props: BookmarkProps) {
  return (
    <section className="view active">
      <h2>Evidence Catalogue</h2>
      <CaseDataGate>{(data) => <EvidenceContent data={data} {...props} />}</CaseDataGate>
    </section>
  );
}
