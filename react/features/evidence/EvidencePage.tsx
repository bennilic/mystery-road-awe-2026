import { useState, type ChangeEvent } from "react";
import { useSearchParams } from "react-router";
import { CaseDataGate } from "../../shared/data/CaseDataGate.tsx";
import type { CaseData } from "../../shared/data/CaseDataContext.tsx";
import { OPEN_EVIDENCE_PARAM } from "../../shared/routing/paths.ts";
import { readBookmarkIds, writeBookmarkIds } from "../../shared/storage/bookmarkStorage.ts";
import { readNotes, writeNotes } from "../../shared/storage/noteStorage.ts";
import { describeStorageFailure } from "../../shared/storage/describeStorageFailure.ts";
import { EvidenceCard } from "./EvidenceCard.tsx";
import { EvidenceDetail } from "./EvidenceDetail.tsx";
import { EvidenceToolbar } from "./EvidenceToolbar.tsx";

// Feature component: owns the Evidence page's state and wires events to it.
function EvidenceContent({ data }: { data: CaseData }) {
  const [searchParams] = useSearchParams();
  const [bookmarkedIds, setBookmarkedIds] = useState(readBookmarkIds);
  const [notes, setNotes] = useState(readNotes);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEvidenceId, setSelectedEvidenceId] = useState<string | null>(() =>
    searchParams.get(OPEN_EVIDENCE_PARAM),
  );
  const [storageNotice, setStorageNotice] = useState<string | null>(null);

  function handleSearchChange(event: ChangeEvent<HTMLInputElement>) {
    setSearchTerm(event.target.value);
  }

  function handleToggleBookmark(evidenceId: string) {
    const nextIds = bookmarkedIds.includes(evidenceId)
      ? bookmarkedIds.filter((id) => id !== evidenceId)
      : [...bookmarkedIds, evidenceId];
    setBookmarkedIds(nextIds);
    try {
      writeBookmarkIds(nextIds);
    } catch (error) {
      setStorageNotice(describeStorageFailure("Your bookmark", error));
    }
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

  const normalizedTerm = searchTerm.toLowerCase().trim();
  const visibleEvidence = data.evidence.filter((item) =>
    `${item.title} ${item.summary} ${item.tags.join(" ")}`.toLowerCase().includes(normalizedTerm),
  );

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
        onSearchChange={handleSearchChange}
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
              onToggleBookmark={handleToggleBookmark}
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

export function EvidencePage() {
  return (
    <section className="view active">
      <h2>Evidence Catalogue</h2>
      <CaseDataGate>{(data) => <EvidenceContent data={data} />}</CaseDataGate>
    </section>
  );
}
