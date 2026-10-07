import { useState } from "react";
import type { Professional } from "../../types/professional";
import { rangesOverlap, timeToMinutes, type Block, type BlockInput, type Session } from "../../types/session";

interface Props {
  date: string;
  professionals: Professional[];
  defaultProfessionalId?: string;
  defaultStartTime?: string;
  /** Sessões e bloqueios já existentes nesse dia (todos os profissionais) — usados pra checar conflito. */
  sessions: Session[];
  blocks: Block[];
  onSave: (input: BlockInput) => Promise<void>;
  onClose: () => void;
}

export default function BlockModal({
  date,
  professionals,
  defaultProfessionalId,
  defaultStartTime,
  sessions,
  blocks,
  onSave,
  onClose,
}: Props) {
  const [professionalId, setProfessionalId] = useState(
    defaultProfessionalId ?? professionals[0]?.id ?? ""
  );
  const [startTime, setStartTime] = useState(defaultStartTime ?? "12:00");
  const [endTime, setEndTime] = useState(defaultStartTime ? addHalfHour(defaultStartTime) : "12:30");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addHalfHour(time: string) {
    const [h, m] = time.split(":").map(Number);
    const total = h * 60 + m + 30;
    return `${Math.floor(total / 60).toString().padStart(2, "0")}:${(total % 60)
      .toString()
      .padStart(2, "0")}`;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!professionalId) {
      setError("Seleccione un profesional.");
      return;
    }
    if (endTime <= startTime) {
      setError("El horario final tiene que ser después del inicial.");
      return;
    }

    const durationMinutes = timeToMinutes(endTime) - timeToMinutes(startTime);
    const conflictingSession = sessions.find(
      (s) => s.professionalId === professionalId && rangesOverlap(startTime, durationMinutes, s.startTime, s.durationMinutes)
    );
    if (conflictingSession) {
      setError(
        `Ese horario tiene conflicto con la sesión de ${conflictingSession.patientName} a las ${conflictingSession.startTime}. Reasigne o cancele esa sesión antes de bloquear.`
      );
      return;
    }
    const conflictingBlock = blocks.find(
      (b) =>
        b.professionalId === professionalId &&
        rangesOverlap(startTime, durationMinutes, b.startTime, timeToMinutes(b.endTime) - timeToMinutes(b.startTime))
    );
    if (conflictingBlock) {
      setError(`Ese horario ya está bloqueado${conflictingBlock.reason ? ` ("${conflictingBlock.reason}")` : ""}.`);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await onSave({
        date,
        professionalId,
        startTime,
        endTime,
        reason: reason.trim() || undefined,
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
        <h2>Bloquear horario</h2>
        {error && <div className="error-banner">{error}</div>}

        <div className="field">
          <label htmlFor="professional">Profesional</label>
          <select
            id="professional"
            value={professionalId}
            onChange={(e) => setProfessionalId(e.target.value)}
          >
            {professionals.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="field-row">
          <div className="field">
            <label htmlFor="startTime">Inicio</label>
            <input
              id="startTime"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="endTime">Fin</label>
            <input id="endTime" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
          </div>
        </div>

        <div className="field">
          <label htmlFor="reason">Motivo (opcional)</label>
          <input
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Almuerzo, Retiro, etc."
          />
        </div>

        <div className="form-actions">
          <button type="submit" className="btn" disabled={saving}>
            {saving ? "Guardando..." : "Bloquear"}
          </button>
          <button type="button" className="btn secondary" onClick={onClose}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
