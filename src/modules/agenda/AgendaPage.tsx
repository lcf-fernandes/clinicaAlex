import { useMemo, useState } from "react";
import { useProfessionals } from "../professionals/useProfessionals";
import { useRecurringRules } from "../recurring/useRecurringRules";
import { useSessions } from "./useSessions";
import { useBlocks } from "./useBlocks";
import { useScheduleExceptions } from "./useScheduleExceptions";
import { useWaitlist } from "../waitlist/useWaitlist";
import { useAutoGenerateRecurringSessions } from "./useAutoGenerateRecurringSessions";
import { matchesSlot } from "../../types/waitlistEntry";
import SessionModal from "./SessionModal";
import BlockModal from "./BlockModal";
import AbsenceModal from "./AbsenceModal";
import AbsentProfessionalBanner from "./AbsentProfessionalBanner";
import { addDays, formatLongDate, todayISO, weekdayOf } from "../../shared/date";
import { minutesToTime, timeToMinutes, STATUS_LABELS, type Session, type Block } from "../../types/session";
import type { Professional } from "../../types/professional";

interface SessionModalState {
  professional: Professional;
  startTime: string;
  existing?: Session;
}

interface Column {
  professional: Professional;
  schedule: { start: string; end: string };
}

export default function AgendaPage() {
  const [date, setDate] = useState(todayISO());
  const { professionals, loading: loadingProfessionals } = useProfessionals();
  const { sessions, loading: loadingSessions, error: sessionsError, addSession, updateSession, removeSession } =
    useSessions(date);
  const { blocks, loading: loadingBlocks, error: blocksError, addBlock, removeBlock } = useBlocks(date);
  const { rules, loading: loadingRules } = useRecurringRules();
  const {
    exceptions,
    loading: loadingExceptions,
    addException,
    removeException,
  } = useScheduleExceptions(date);
  const { entries: waitlistEntries, setStatus: setWaitlistStatus } = useWaitlist();

  const [sessionModal, setSessionModal] = useState<SessionModalState | null>(null);
  const [blockModal, setBlockModal] = useState(false);
  const [absenceModal, setAbsenceModal] = useState(false);

  const weekday = weekdayOf(date);

  useAutoGenerateRecurringSessions({
    date,
    weekday,
    rules,
    rulesLoading: loadingRules,
    sessions,
    sessionsLoading: loadingSessions,
    blocks,
    blocksLoading: loadingBlocks,
    addSession,
  });

  const scheduledProfessionals = useMemo(
    () =>
      professionals
        .filter((p) => p.active && p.defaultSchedule[weekday])
        .sort((a, b) => a.name.localeCompare(b.name)),
    [professionals, weekday]
  );

  const absentIds = useMemo(() => new Set(exceptions.map((e) => e.professionalId)), [exceptions]);

  const columns = useMemo<Column[]>(() => {
    const result: Column[] = [];
    const byId = new Map<string, Column>();

    scheduledProfessionals
      .filter((p) => !absentIds.has(p.id))
      .forEach((p) => {
        const col: Column = { professional: p, schedule: p.defaultSchedule[weekday]! };
        result.push(col);
        byId.set(p.id, col);
      });

    exceptions.forEach((ex) => {
      if (!ex.replacementProfessionalId) return;
      const replacement = professionals.find((p) => p.id === ex.replacementProfessionalId);
      if (!replacement || !replacement.active) return;
      const absentProfessional = professionals.find((p) => p.id === ex.professionalId);
      const absentSchedule = absentProfessional?.defaultSchedule[weekday];
      if (!absentSchedule) return;

      const existingCol = byId.get(replacement.id);
      if (existingCol) {
        existingCol.schedule = {
          start: minutesToTime(Math.min(timeToMinutes(existingCol.schedule.start), timeToMinutes(absentSchedule.start))),
          end: minutesToTime(Math.max(timeToMinutes(existingCol.schedule.end), timeToMinutes(absentSchedule.end))),
        };
      } else {
        const col: Column = { professional: replacement, schedule: absentSchedule };
        result.push(col);
        byId.set(replacement.id, col);
      }
    });

    return result.sort((a, b) => a.professional.name.localeCompare(b.professional.name));
  }, [scheduledProfessionals, absentIds, exceptions, professionals, weekday]);

  const slots = useMemo(() => {
    if (columns.length === 0) return [];
    let minStart = Infinity;
    let maxEnd = -Infinity;
    columns.forEach((col) => {
      minStart = Math.min(minStart, timeToMinutes(col.schedule.start));
      maxEnd = Math.max(maxEnd, timeToMinutes(col.schedule.end));
    });
    const result: string[] = [];
    for (let t = minStart; t < maxEnd; t += 30) result.push(minutesToTime(t));
    return result;
  }, [columns]);

  const loading = loadingProfessionals || loadingSessions || loadingBlocks || loadingExceptions;

  function openCreate(professional: Professional, startTime: string) {
    setSessionModal({ professional, startTime });
  }

  function openEdit(professional: Professional, session: Session) {
    setSessionModal({ professional, startTime: session.startTime, existing: session });
  }

  async function handleRemoveBlock(block: Block) {
    if (confirm(`¿Eliminar el bloqueo${block.reason ? ` "${block.reason}"` : ""}?`)) {
      await removeBlock(block.id);
    }
  }

  async function handleReassign(session: Session, targetId: string, targetName: string) {
    await updateSession(session.id, {
      professionalId: targetId,
      professionalName: targetName,
      scheduledProfessionalId: session.scheduledProfessionalId ?? session.professionalId,
      scheduledProfessionalName: session.scheduledProfessionalName ?? session.professionalName,
    });
  }

  async function handleCancelSession(session: Session) {
    await updateSession(session.id, { status: "cancelo_aviso" });
  }

  const waitlistMatches = useMemo(() => {
    if (!sessionModal || sessionModal.existing) return [];
    return waitlistEntries.filter((e) =>
      matchesSlot(e, sessionModal.professional.id, weekday, sessionModal.startTime)
    );
  }, [sessionModal, waitlistEntries, weekday]);

  const occupied = useMemo(() => {
    if (!sessionModal) return [];
    const profSessions = sessions.filter(
      (s) => s.professionalId === sessionModal.professional.id && s.id !== sessionModal.existing?.id
    );
    const profBlocks = blocks.filter((b) => b.professionalId === sessionModal.professional.id);
    return [
      ...profSessions.map((s) => ({ startTime: s.startTime, durationMinutes: s.durationMinutes })),
      ...profBlocks.map((b) => ({
        startTime: b.startTime,
        durationMinutes: timeToMinutes(b.endTime) - timeToMinutes(b.startTime),
      })),
    ];
  }, [sessionModal, sessions, blocks]);

  return (
    <div>
      <div className="page-header no-print">
        <div className="agenda-date-nav">
          <button className="btn secondary" onClick={() => setDate((d) => addDays(d, -1))}>
            ← Anterior
          </button>
          <button className="btn secondary" onClick={() => setDate(todayISO())}>
            Hoy
          </button>
          <button className="btn secondary" onClick={() => setDate((d) => addDays(d, 1))}>
            Siguiente →
          </button>
        </div>
        <div className="row-actions">
          {scheduledProfessionals.filter((p) => !absentIds.has(p.id)).length > 0 && (
            <button className="btn secondary" onClick={() => setAbsenceModal(true)}>
              + Profesional ausente
            </button>
          )}
          {columns.length > 0 && (
            <button className="btn secondary" onClick={() => setBlockModal(true)}>
              + Bloquear horario
            </button>
          )}
          {columns.length > 0 && (
            <button className="btn" onClick={() => window.print()}>
              🖶 Imprimir
            </button>
          )}
        </div>
      </div>

      <h1 className="agenda-date-title">{formatLongDate(date)}</h1>

      {(sessionsError || blocksError) && (
        <div className="error-banner">{sessionsError ?? blocksError}</div>
      )}

      {exceptions.map((ex) => (
        <AbsentProfessionalBanner
          key={ex.id}
          exception={ex}
          sessions={sessions.filter((s) => s.professionalId === ex.professionalId)}
          replacementOptions={professionals.filter((p) => p.active && p.id !== ex.professionalId)}
          onReassign={handleReassign}
          onCancelSession={handleCancelSession}
          onRemoveException={() => removeException(ex.id)}
        />
      ))}

      {loading ? (
        <p>Cargando...</p>
      ) : columns.length === 0 ? (
        <div className="empty-state">
          Ningún profesional está programado para este día. Configure el horario semanal en Profesionales.
        </div>
      ) : (
        <div className="agenda-scroll">
          <div
            className="agenda-grid"
            style={{
              gridTemplateColumns: `72px repeat(${columns.length}, minmax(170px, 1fr))`,
              gridTemplateRows: `44px repeat(${slots.length}, 30px)`,
            }}
          >
            <div className="agenda-corner" style={{ gridRow: 1, gridColumn: 1 }} />
            {columns.map((col, i) => (
              <div className="agenda-col-header" key={col.professional.id} style={{ gridRow: 1, gridColumn: i + 2 }}>
                {col.professional.name}
              </div>
            ))}

            {slots.map((t, rowIdx) => (
              <div className="agenda-time-label" key={t} style={{ gridRow: rowIdx + 2, gridColumn: 1 }}>
                {t.endsWith(":00") ? t : ""}
              </div>
            ))}

            {columns.map((col, colIdx) => {
              const prof = col.professional;
              const daySchedule = col.schedule;
              const profSessions = sessions.filter((s) => s.professionalId === prof.id);
              const profBlocks = blocks.filter((b) => b.professionalId === prof.id);
              const continuationSlots = new Set<string>();
              profSessions.forEach((s) => {
                const startMin = timeToMinutes(s.startTime);
                const span = s.durationMinutes / 30;
                for (let k = 1; k < span; k++) continuationSlots.add(minutesToTime(startMin + k * 30));
              });

              return slots.map((t, rowIdx) => {
                if (continuationSlots.has(t)) return null;

                const gridRow = rowIdx + 2;
                const gridColumn = colIdx + 2;
                const tMin = timeToMinutes(t);

                const outside =
                  tMin < timeToMinutes(daySchedule.start) || tMin >= timeToMinutes(daySchedule.end);
                if (outside) {
                  return (
                    <div
                      key={t}
                      className="agenda-cell agenda-cell-outside"
                      style={{ gridRow, gridColumn }}
                    />
                  );
                }

                // Sessão checada ANTES de bloqueio — por mais que a
                // criação de um bloqueio já valide contra sessões
                // existentes, uma sessão nunca deve ficar escondida
                // atrás de um bloqueio na grade (defesa extra contra
                // dado antigo ou qualquer inconsistência futura).
                const session = profSessions.find((s) => s.startTime === t);
                if (session) {
                  const span = session.durationMinutes / 30;
                  return (
                    <button
                      key={t}
                      type="button"
                      className={`agenda-cell agenda-session status-${session.status}`}
                      style={{ gridRow: `${gridRow} / span ${span}`, gridColumn }}
                      onClick={() => openEdit(prof, session)}
                    >
                      <strong>{session.patientName}</strong>
                      <span>
                        {STATUS_LABELS[session.status]}
                        {session.scheduledProfessionalName && ` · reemplazo de ${session.scheduledProfessionalName}`}
                      </span>
                    </button>
                  );
                }

                const block = profBlocks.find(
                  (b) => tMin >= timeToMinutes(b.startTime) && tMin < timeToMinutes(b.endTime)
                );
                if (block) {
                  return (
                    <button
                      key={t}
                      type="button"
                      className="agenda-cell agenda-cell-blocked"
                      style={{ gridRow, gridColumn }}
                      onClick={() => handleRemoveBlock(block)}
                    >
                      Bloqueado{block.reason ? ` — ${block.reason}` : ""}
                    </button>
                  );
                }

                return (
                  <button
                    key={t}
                    type="button"
                    className="agenda-cell agenda-cell-available"
                    style={{ gridRow, gridColumn }}
                    onClick={() => openCreate(prof, t)}
                  >
                    Disponible
                  </button>
                );
              });
            })}
          </div>
        </div>
      )}

      {sessionModal && (
        <SessionModal
          date={date}
          professionalId={sessionModal.professional.id}
          professionalName={sessionModal.professional.name}
          defaultStartTime={sessionModal.startTime}
          existing={sessionModal.existing}
          occupied={occupied}
          waitlistMatches={waitlistMatches}
          onSave={async (input) => {
            if (sessionModal.existing) {
              await updateSession(sessionModal.existing.id, input);
            } else {
              await addSession(input);
            }
          }}
          onDelete={
            sessionModal.existing
              ? async () => {
                  await removeSession(sessionModal.existing!.id);
                }
              : undefined
          }
          onConvertWaitlistEntry={(entryId) => setWaitlistStatus(entryId, "convertido")}
          onClose={() => setSessionModal(null)}
        />
      )}

      {blockModal && (
        <BlockModal
          date={date}
          professionals={columns.map((c) => c.professional)}
          sessions={sessions}
          blocks={blocks}
          onSave={async (input) => {
            await addBlock(input);
          }}
          onClose={() => setBlockModal(false)}
        />
      )}

      {absenceModal && (
        <AbsenceModal
          date={date}
          scheduledProfessionals={scheduledProfessionals.filter((p) => !absentIds.has(p.id))}
          allProfessionals={professionals}
          onSave={async (input) => {
            await addException(input);
          }}
          onClose={() => setAbsenceModal(false)}
        />
      )}
    </div>
  );
}
