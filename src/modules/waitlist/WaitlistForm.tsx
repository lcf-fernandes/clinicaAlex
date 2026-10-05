import { useMemo, useState } from "react";
import { usePatients } from "../patients/usePatients";
import { useProfessionals } from "../professionals/useProfessionals";
import { WEEKDAYS, type Weekday } from "../../types/professional";
import { PREFERRED_TIME_LABELS, type PreferredTime, type WaitlistEntryInput } from "../../types/waitlistEntry";

interface Props {
  onSave: (input: WaitlistEntryInput) => Promise<void>;
  onCancel: () => void;
}

export default function WaitlistForm({ onSave, onCancel }: Props) {
  const { patients } = usePatients();
  const { professionals } = useProfessionals();

  const [patientSearch, setPatientSearch] = useState("");
  const [patientId, setPatientId] = useState("");
  const [preferredTime, setPreferredTime] = useState<PreferredTime>("cualquiera");
  const [preferredProfessionalId, setPreferredProfessionalId] = useState("");
  const [preferredDays, setPreferredDays] = useState<Weekday[]>([]);
  const [observation, setObservation] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const patientMatches = useMemo(() => {
    const term = patientSearch.trim().toLowerCase();
    if (!term || patientId) return [];
    return patients.filter((p) => p.fullName.toLowerCase().includes(term)).slice(0, 6);
  }, [patientSearch, patientId, patients]);

  function pickPatient(id: string, name: string) {
    setPatientId(id);
    setPatientSearch(name);
  }

  function toggleDay(day: Weekday) {
    setPreferredDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!patientId) {
      setError("Seleccione un paciente de la lista.");
      return;
    }
    const professional = professionals.find((p) => p.id === preferredProfessionalId);
    setSaving(true);
    setError(null);
    try {
      await onSave({
        patientId,
        patientName: patientSearch.trim(),
        preferredTime,
        preferredProfessionalId: preferredProfessionalId || undefined,
        preferredProfessionalName: preferredProfessionalId ? professional?.name : undefined,
        preferredDays,
        observation: observation.trim() || undefined,
        status: "esperando",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="panel" onSubmit={handleSubmit}>
      <h2>Agregar a la lista de espera</h2>
      {error && <div className="error-banner">{error}</div>}

      <div className="field" style={{ position: "relative" }}>
        <label htmlFor="patient">Paciente</label>
        <input
          id="patient"
          value={patientSearch}
          onChange={(e) => {
            setPatientSearch(e.target.value);
            setPatientId("");
          }}
          placeholder="Buscar paciente..."
          autoComplete="off"
        />
        {patientMatches.length > 0 && (
          <div className="autocomplete-list">
            {patientMatches.map((p) => (
              <button
                type="button"
                key={p.id}
                className="autocomplete-item"
                onClick={() => pickPatient(p.id, p.fullName)}
              >
                {p.fullName}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="field">
        <label htmlFor="preferredTime">Preferencia de horario</label>
        <select
          id="preferredTime"
          value={preferredTime}
          onChange={(e) => setPreferredTime(e.target.value as PreferredTime)}
        >
          {Object.entries(PREFERRED_TIME_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="preferredProfessional">Profesional preferido (opcional)</label>
        <select
          id="preferredProfessional"
          value={preferredProfessionalId}
          onChange={(e) => setPreferredProfessionalId(e.target.value)}
        >
          <option value="">— cualquiera —</option>
          {professionals
            .filter((p) => p.active)
            .map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
        </select>
      </div>

      <div className="field">
        <label>Días preferidos (ninguno seleccionado = cualquier día)</label>
        <div className="weekday-checkboxes">
          {WEEKDAYS.map((w) => (
            <label key={w.key} className="weekday-checkbox">
              <input
                type="checkbox"
                checked={preferredDays.includes(w.key)}
                onChange={() => toggleDay(w.key)}
              />
              {w.label}
            </label>
          ))}
        </div>
      </div>

      <div className="field">
        <label htmlFor="observation">Observación (opcional)</label>
        <input
          id="observation"
          value={observation}
          onChange={(e) => setObservation(e.target.value)}
          placeholder="Cualquier horario por la tarde, prefiere los lunes..."
        />
      </div>

      <div className="form-actions">
        <button type="submit" className="btn" disabled={saving}>
          {saving ? "Guardando..." : "Agregar"}
        </button>
        <button type="button" className="btn secondary" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
