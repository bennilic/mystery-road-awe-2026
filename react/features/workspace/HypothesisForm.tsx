import { useState, type ChangeEvent, type FormEvent } from "react";
import {
  readHypothesisDraft,
  writeHypothesisDraft,
} from "../../shared/storage/hypothesisStorage.ts";
import type { Evidence, HypothesisDraft, Person } from "../../../js/types.ts";

const SAVED_MESSAGE_MS = 2000;

function readText(formData: FormData, fieldName: string): string {
  const value = formData.get(fieldName);
  return typeof value === "string" ? value : "";
}

interface HypothesisFormProps {
  people: Person[];
  evidence: Evidence[];
}

export function HypothesisForm({ people, evidence }: HypothesisFormProps) {
  // Initial values only: the fields below are uncontrolled (defaultValue).
  const [storedDraft] = useState(readHypothesisDraft);
  const [confidence, setConfidence] = useState(storedDraft.confidence);
  const [isSavedMessageVisible, setIsSavedMessageVisible] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  function handleConfidenceChange(event: ChangeEvent<HTMLInputElement>) {
    setConfidence(event.target.value);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const draft: HypothesisDraft = {
      suspectId: readText(formData, "suspectId"),
      nature: readText(formData, "nature"),
      evidenceIds: formData.getAll("evidenceIds").filter((id) => typeof id === "string"),
      confidence: readText(formData, "confidence"),
      explanation: readText(formData, "explanation"),
      alternative: readText(formData, "alternative"),
      savedAt: new Date().toISOString(),
    };
    try {
      writeHypothesisDraft(draft);
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      setSaveError(
        `Your hypothesis draft could not be saved to this browser (${reason}). Free up browser storage or leave private browsing, then press Save again.`,
      );
      return;
    }
    setSaveError(null);
    setIsSavedMessageVisible(true);
    setTimeout(() => setIsSavedMessageVisible(false), SAVED_MESSAGE_MS);
  }

  return (
    <div className="hypothesis-card">
      <h3>Hypothesis Draft</h3>
      <form id="hypothesisForm" onSubmit={handleSubmit}>
        <div className="form-row">
          <label htmlFor="hypSuspect">Suspected responsible person</label>
          <select id="hypSuspect" name="suspectId" defaultValue={storedDraft.suspectId}>
            <option value="">Select a person…</option>
            {people.map((person) => (
              <option key={person.id} value={person.id}>
                {person.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-row">
          <label htmlFor="hypNature">Accidental or deliberate incident</label>
          <select id="hypNature" name="nature" defaultValue={storedDraft.nature}>
            <option value="">Select…</option>
            <option value="accidental">Accidental</option>
            <option value="deliberate">Deliberate</option>
            <option value="unclear">Unclear</option>
          </select>
        </div>

        <div className="form-row">
          <label htmlFor="hypEvidence">Selected supporting evidence</label>
          <select
            id="hypEvidence"
            name="evidenceIds"
            multiple
            size={6}
            defaultValue={storedDraft.evidenceIds}
          >
            {evidence.map((item) => (
              <option key={item.id} value={item.id}>
                {item.id} - {item.title}
              </option>
            ))}
          </select>
        </div>

        <div className="form-row">
          <label htmlFor="hypConfidence">Confidence (0–100)</label>
          <input
            type="range"
            id="hypConfidence"
            name="confidence"
            min={0}
            max={100}
            defaultValue={storedDraft.confidence}
            onChange={handleConfidenceChange}
          />
          <output id="hypConfidenceValue">{confidence}</output>
        </div>

        <div className="form-row">
          <label htmlFor="hypExplanation">Written explanation</label>
          <textarea
            id="hypExplanation"
            name="explanation"
            rows={4}
            placeholder="Explain your reasoning…"
            defaultValue={storedDraft.explanation}
          />
        </div>

        <div className="form-row">
          <label htmlFor="hypAlternative">Alternative explanation</label>
          <textarea
            id="hypAlternative"
            name="alternative"
            rows={3}
            placeholder="What else could explain the evidence?"
            defaultValue={storedDraft.alternative}
          />
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary">
            Save hypothesis draft
          </button>
          {isSavedMessageVisible && (
            <span id="hypothesisSavedMsg" className="saved-msg">
              Saved
            </span>
          )}
        </div>
        {saveError && <p role="alert">{saveError}</p>}
      </form>
    </div>
  );
}
