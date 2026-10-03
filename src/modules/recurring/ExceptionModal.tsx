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
      setError("Selecione o profissional substituto.");
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
      setError(err instanceof Error ? err.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <form className="panel modal-panel" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <h2>Exceção — {rule.patientName}</h2>
        <p style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: -8 }}>
          Vale só nessa data; a regra permanente ({rule.time}, {rule.professionalName}) continua valendo
          nas outras semanas.
        </p>
        {error && <div className="error-banner">{error}</div>}

        <div className="field">
          <label htmlFor="exDate">Data</label>
          <input id="exDate" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>

        <div className="field">
          <label htmlFor="exAction">O que acontece nessa data</label>
          <select
            id="exAction"
            value={action}
            onChange={(e) => setAction(e.target.value as RecurringExceptionAction)}
          >
            <option value="cancel">Não vem (sem sessão nesse dia)</option>
            <option value="reassign">Atende com outro profissional</option>
            <option value="reschedule">Muda de horário</option>
          </select>
        </div>

        {action === "reassign" && (
          <div className="field">
            <label htmlFor="exProfessional">Profissional substituto</label>
            <select
              id="exProfessional"
              value={newProfessionalId}
              onChange={(e) => setNewProfessionalId(e.target.value)}
            >
              <option value="">— selecione —</option>
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
            <label htmlFor="exTime">Novo horário</label>
            <input id="exTime" type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} />
          </div>
        )}

        <div className="field">
          <label htmlFor="exNote">Observação (opcional)</label>
          <input id="exNote" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>

        <div className="form-actions">
          <button type="submit" className="btn" disabled={saving}>
            {saving ? "Salvando..." : "Salvar exceção"}
          </button>
          <button type="button" className="btn secondary" onClick={onClose}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
