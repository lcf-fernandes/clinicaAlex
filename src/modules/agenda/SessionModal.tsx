import { useMemo, useState } from "react";
import { usePatients } from "../patients/usePatients";
import {
  PAYMENT_LABELS,
  STATUS_LABELS,
  rangesOverlap,
  type PaymentMethod,
  type Session,
  type SessionInput,
  type SessionStatus,
} from "../../types/session";

interface ConflictCheckItem {
  startTime: string;
  durationMinutes: number;
}

interface Props {
  date: string;
  professionalId: string;
  professionalName: string;
  defaultStartTime: string;
  existing?: Session;
  /** Sessões/bloqueios já ocupados desse profissional nesse dia, pra validar sobreposição (exclui a própria sessão em edição). */
  occupied: ConflictCheckItem[];
  onSave: (input: SessionInput) => Promise<void>;
  onDelete?: () => Promise<void>;
  onClose: () => void;
}

export default function SessionModal({
  date,
  professionalId,
  professionalName,
  defaultStartTime,
  existing,
  occupied,
  onSave,
  onDelete,
  onClose,
}: Props) {
  const { patients } = usePatients();
  const [patientSearch, setPatientSearch] = useState(existing?.patientName ?? "");
  const [patientId, setPatientId] = useState(existing?.patientId ?? "");
  const [startTime, setStartTime] = useState(existing?.startTime ?? defaultStartTime);
  const [durationMinutes, setDurationMinutes] = useState(existing?.durationMinutes ?? 60);
  const [status, setStatus] = useState<SessionStatus>(existing?.status ?? "agendado");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "">(
    existing?.payment?.method ?? ""
  );
  const [paymentAmount, setPaymentAmount] = useState(existing?.payment?.amount ?? 0);
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const matches = useMemo(() => {
    const term = patientSearch.trim().toLowerCase();
    if (!term || patientId) return [];
    return patients.filter((p) => p.fullName.toLowerCase().includes(term)).slice(0, 6);
  }, [patientSearch, patientId, patients]);

  function pickPatient(id: string, name: string) {
    setPatientId(id);
    setPatientSearch(name);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!patientId) {
      setError("Selecione um paciente da lista.");
      return;
    }
    const conflict = occupied.some((o) =>
      rangesOverlap(startTime, durationMinutes, o.startTime, o.durationMinutes)
    );
    if (conflict) {
      setError("Esse horário conflita com outra sessão ou bloqueio já existente.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave({
        date,
        professionalId,
        professionalName,
        startTime,
        durationMinutes,
        patientId,
        patientName: patientSearch.trim(),
        status,
        payment: paymentMethod ? { method: paymentMethod, amount: Number(paymentAmount) || 0 } : undefined,
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!onDelete) return;
    if (!confirm("Remover esta sessão? O horário fica disponível de novo.")) return;
    setSaving(true);
    try {
      await onDelete();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao remover.");
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <form className="panel modal-panel" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <h2>
          {existing ? "Editar sessão" : "Nova sessão"} — {professionalName}
        </h2>
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
          {matches.length > 0 && (
            <div className="autocomplete-list">
              {matches.map((p) => (
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

        <div className="field-row">
          <div className="field">
            <label htmlFor="startTime">Horário</label>
            <input
              id="startTime"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="duration">Duração</label>
            <select
              id="duration"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Number(e.target.value))}
            >
              <option value={60}>60 min</option>
              <option value={120}>120 min (sessão dupla)</option>
            </select>
          </div>
        </div>

        <div className="field">
          <label htmlFor="status">Status</label>
          <select id="status" value={status} onChange={(e) => setStatus(e.target.value as SessionStatus)}>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="field-row">
          <div className="field">
            <label htmlFor="paymentMethod">Pagamento</label>
            <select
              id="paymentMethod"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod | "")}
            >
              <option value="">— não registrado —</option>
              {Object.entries(PAYMENT_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="paymentAmount">Valor (Gs)</label>
            <input
              id="paymentAmount"
              type="number"
              min={0}
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(Number(e.target.value))}
              disabled={!paymentMethod}
            />
          </div>
        </div>

        <div className="field">
          <label htmlFor="notes">Observações</label>
          <textarea id="notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        <div className="form-actions">
          <button type="submit" className="btn" disabled={saving}>
            {saving ? "Salvando..." : "Salvar"}
          </button>
          {existing && onDelete && (
            <button type="button" className="btn danger" onClick={handleDelete} disabled={saving}>
              Remover
            </button>
          )}
          <button type="button" className="btn secondary" onClick={onClose}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
