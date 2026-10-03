import { useState } from "react";
import type { Professional } from "../../types/professional";
import type { ScheduleExceptionInput } from "../../types/scheduleException";

interface Props {
  date: string;
  scheduledProfessionals: Professional[];
  allProfessionals: Professional[];
  onSave: (input: ScheduleExceptionInput) => Promise<void>;
  onClose: () => void;
}

export default function AbsenceModal({
  date,
  scheduledProfessionals,
  allProfessionals,
  onSave,
  onClose,
}: Props) {
  const [professionalId, setProfessionalId] = useState(scheduledProfessionals[0]?.id ?? "");
  const [replacementProfessionalId, setReplacementProfessionalId] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const replacementOptions = allProfessionals.filter((p) => p.active && p.id !== professionalId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!professionalId) {
      setError("Selecione quem vai faltar.");
      return;
    }
    const professional = scheduledProfessionals.find((p) => p.id === professionalId);
    const replacement = replacementOptions.find((p) => p.id === replacementProfessionalId);
    setSaving(true);
    setError(null);
    try {
      await onSave({
        professionalId,
        professionalName: professional?.name ?? "",
        date,
        reason: reason.trim() || undefined,
        replacementProfessionalId: replacement?.id,
        replacementProfessionalName: replacement?.name,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <form className="panel modal-panel" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <h2>Profissional ausente</h2>
        {error && <div className="error-banner">{error}</div>}

        <div className="field">
          <label htmlFor="absentProfessional">Quem vai faltar</label>
          <select
            id="absentProfessional"
            value={professionalId}
            onChange={(e) => setProfessionalId(e.target.value)}
          >
            {scheduledProfessionals.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="reason">Motivo (opcional)</label>
          <input
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Doença, viagem, etc."
          />
        </div>

        <div className="field">
          <label htmlFor="replacement">Reemplazo (opcional)</label>
          <select
            id="replacement"
            value={replacementProfessionalId}
            onChange={(e) => setReplacementProfessionalId(e.target.value)}
          >
            <option value="">— sem reemplazo —</option>
            {replacementOptions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
            Se escolher alguém, ele(a) aparece na agenda desse dia usando o horário do profissional
            ausente. Os pacientes já agendados você decide um a um: manter, transferir ou cancelar.
          </span>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn" disabled={saving}>
            {saving ? "Salvando..." : "Confirmar ausência"}
          </button>
          <button type="button" className="btn secondary" onClick={onClose}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
