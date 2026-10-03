import { useState } from "react";
import type { Professional } from "../../types/professional";
import type { ScheduleException } from "../../types/scheduleException";
import type { Session } from "../../types/session";

interface Props {
  exception: ScheduleException;
  sessions: Session[];
  replacementOptions: Professional[];
  onReassign: (session: Session, targetId: string, targetName: string) => Promise<void>;
  onCancelSession: (session: Session) => Promise<void>;
  onRemoveException: () => Promise<void>;
}

function SessionActionRow({
  session,
  defaultTargetId,
  replacementOptions,
  onReassign,
  onCancelSession,
}: {
  session: Session;
  defaultTargetId: string;
  replacementOptions: Professional[];
  onReassign: (session: Session, targetId: string, targetName: string) => Promise<void>;
  onCancelSession: (session: Session) => Promise<void>;
}) {
  const [targetId, setTargetId] = useState(defaultTargetId);
  const [saving, setSaving] = useState(false);

  async function handleTransfer() {
    const target = replacementOptions.find((p) => p.id === targetId);
    if (!target) return;
    setSaving(true);
    try {
      await onReassign(session, target.id, target.name);
    } finally {
      setSaving(false);
    }
  }

  async function handleCancel() {
    if (!confirm(`Cancelar a sessão de ${session.patientName} (${session.startTime})?`)) return;
    setSaving(true);
    try {
      await onCancelSession(session);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="absence-session-row">
      <span>
        {session.startTime} — {session.patientName}
      </span>
      <select value={targetId} onChange={(e) => setTargetId(e.target.value)} disabled={saving}>
        <option value="">— manter pendente —</option>
        {replacementOptions.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
      <button type="button" onClick={handleTransfer} disabled={saving || !targetId}>
        Transferir
      </button>
      <button type="button" onClick={handleCancel} disabled={saving}>
        Cancelar sessão
      </button>
    </div>
  );
}

export default function AbsentProfessionalBanner({
  exception,
  sessions,
  replacementOptions,
  onReassign,
  onCancelSession,
  onRemoveException,
}: Props) {
  return (
    <div className="absence-banner">
      <div className="absence-banner-header">
        <div>
          <strong>{exception.professionalName}</strong> está ausente hoje
          {exception.reason && ` — ${exception.reason}`}
          {exception.replacementProfessionalName && (
            <> · reemplazo: {exception.replacementProfessionalName}</>
          )}
        </div>
        <button type="button" className="link-button" onClick={onRemoveException}>
          desfazer ausência
        </button>
      </div>

      {sessions.length === 0 ? (
        <p style={{ fontSize: 12.5, color: "var(--text-muted)", margin: "6px 0 0" }}>
          Nenhum paciente estava agendado com {exception.professionalName} nesse dia.
        </p>
      ) : (
        <div className="absence-session-list">
          {sessions.map((s) => (
            <SessionActionRow
              key={s.id}
              session={s}
              defaultTargetId={exception.replacementProfessionalId ?? ""}
              replacementOptions={replacementOptions}
              onReassign={onReassign}
              onCancelSession={onCancelSession}
            />
          ))}
        </div>
      )}
    </div>
  );
}
