import { useState, type FormEvent } from "react";
import {
  readHypothesisDraft,
  writeHypothesisDraft,
} from "../../shared/storage/hypothesisStorage.ts";
import type { Evidence, HypothesisDraft, Person } from "../../../js/types.ts";

const SAVED_MESSAGE_MS = 2000;

// Every field the user edits, in one object. savedAt is stamped on save, so it
// is not part of the form's own state.
type HypothesisFormValues = Omit<HypothesisDraft, "savedAt">;

interface HypothesisFormProps {
  people: Person[];
  evidence: Evidence[];
}

export function HypothesisForm({ people, evidence }: HypothesisFormProps) {
  const [values, setValues] = useState<HypothesisFormValues>(readHypothesisDraft);
  const [isSavedMessageVisible, setIsSavedMessageVisible] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // One updater for all fields: copies the old object and replaces one key.
  function updateField<Field extends keyof HypothesisFormValues>(
    field: Field,
    value: HypothesisFormValues[Field],
  ) {
    setValues((previous) => ({ ...previous, [field]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const draft: HypothesisDraft = { ...values, savedAt: new Date().toISOString() };
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
          <select
            id="hypSuspect"
            value={values.suspectId}
            onChange={(event) => updateField("suspectId", event.target.value)}
          >
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
          <select
            id="hypNature"
            value={values.nature}
            onChange={(event) => updateField("nature", event.target.value)}
          >
            <option value="">Select…</option>
            <option value="accidental">Accidental</option>
            <option value="deliberate">Deliberate</option>
            <option value="unclear">Unclear</option>
          </select>
        </div>

        <div className="form-row">
          <label htmlFor="hypEvidence">Selected supporting evidence</label>
          {/* A multi-select's value is an array; the change event exposes the
              chosen <option>s through selectedOptions. */}
          <select
            id="hypEvidence"
            multiple
            size={6}
            value={values.evidenceIds}
            onChange={(event) =>
              updateField(
                "evidenceIds",
                Array.from(event.target.selectedOptions, (option) => option.value),
              )
            }
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
            min={0}
            max={100}
            value={values.confidence}
            onChange={(event) => updateField("confidence", event.target.value)}
          />
          {/* Read from the same state as the slider: no second copy to sync. */}
          <output id="hypConfidenceValue">{values.confidence}</output>
        </div>

        <div className="form-row">
          <label htmlFor="hypExplanation">Written explanation</label>
          <textarea
            id="hypExplanation"
            rows={4}
            placeholder="Explain your reasoning…"
            value={values.explanation}
            onChange={(event) => updateField("explanation", event.target.value)}
          />
        </div>

        <div className="form-row">
          <label htmlFor="hypAlternative">Alternative explanation</label>
          <textarea
            id="hypAlternative"
            rows={3}
            placeholder="What else could explain the evidence?"
            value={values.alternative}
            onChange={(event) => updateField("alternative", event.target.value)}
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
