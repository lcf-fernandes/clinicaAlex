import { useState } from "react";
import { useProfessionals } from "../professionals/useProfessionals";
import type { RecurringException, RecurringExceptionAction, RecurringRule } from "../../types/recurringRule";
import { todayISO } from "../../shared/date";

interface Props {
  rule: RecurringRule;
  onSave: (exception: RecurringException) => Promise<void>;
  onClose: () => void;
}

export default function ExceptionModal({ rule, onSave, onClose }: Props) {
  const { professionals } = useProfessionals();
  const [date, setDate] = useState(todayISO());
  const [action, setAction] = useState<RecurringExceptionAction>("cancel");
  const [newProfessionalId, setNewProfessionalId] = useState("");
  const [newTime, setNewTime] = useState(rule.time);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (action === "reassign" && !newProfessionalId) {
      setError("Seleccione el profesional sustituto.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const professional = professionals.find((p) => p.id === newProfessionalId);
      await onSave({
        date,
        action,
        newProfessionalId: action === "reassign" ? newProfessionalId : undefined,
        newProfessionalName: action === "reassign" ? professional?.name : undefined,
        newTime: action === "reschedule" ? newTime : undefined,
        note: note.trim() || undefined,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <form className="panel modal-panel" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <h2>Excepción — {rule.patientName}</h2>
        <p style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: -8 }}>
          Vale solo para esa fecha; la regla permanente ({rule.time}, {rule.professionalName}) sigue
          valiendo en las demás semanas.
        </p>
        {error && <div className="error-banner">{error}</div>}

        <div className="field">
          <label htmlFor="exDate">Fecha</label>
          <input id="exDate" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>

        <div className="field">
          <label htmlFor="exAction">Qué pasa en esa fecha</label>
          <select
            id="exAction"
            value={action}
            onChange={(e) => setAction(e.target.value as RecurringExceptionAction)}
          >
            <option value="cancel">No viene (sin sesión ese día)</option>
            <option value="reassign">Atiende con otro profesional</option>
            <option value="reschedule">Cambia de horario</option>
          </select>
        </div>

        {action === "reassign" && (
          <div className="field">
            <label htmlFor="exProfessional">Profesional sustituto</label>
            <select
              id="exProfessional"
              value={newProfessionalId}
              onChange={(e) => setNewProfessionalId(e.target.value)}
            >
              <option value="">— seleccione —</option>
              {professionals
                .filter((p) => p.active)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
            </select>
          </div>
        )}

        {action === "reschedule" && (
          <div className="field">
            <label htmlFor="exTime">Nuevo horario</label>
            <input id="exTime" type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} />
          </div>
        )}

        <div className="field">
          <label htmlFor="exNote">Observación (opcional)</label>
          <input id="exNote" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>

        <div className="form-actions">
          <button type="submit" className="btn" disabled={saving}>
            {saving ? "Guardando..." : "Guardar excepción"}
          </button>
          <button type="button" className="btn secondary" onClick={onClose}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
