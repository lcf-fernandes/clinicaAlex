import { useMemo, useState } from "react";
import { useProfessionals } from "../professionals/useProfessionals";
import { useRecurringRules } from "../recurring/useRecurringRules";
import { useSessions } from "./useSessions";
import { useBlocks } from "./useBlocks";
import { useAutoGenerateRecurringSessions } from "./useAutoGenerateRecurringSessions";
import SessionModal from "./SessionModal";
import BlockModal from "./BlockModal";
import { addDays, formatLongDate, todayISO, weekdayOf } from "../../shared/date";
import { minutesToTime, timeToMinutes, STATUS_LABELS, type Session, type Block } from "../../types/session";
import type { Professional } from "../../types/professional";

interface SessionModalState {
  professional: Professional;
  startTime: string;
  existing?: Session;
}

export default function AgendaPage() {
  const [date, setDate] = useState(todayISO());
  const { professionals, loading: loadingProfessionals } = useProfessionals();
  const { sessions, loading: loadingSessions, error: sessionsError, addSession, updateSession, removeSession } =
    useSessions(date);
  const { blocks, loading: loadingBlocks, error: blocksError, addBlock, removeBlock } = useBlocks(date);
  const { rules, loading: loadingRules } = useRecurringRules();

  const [sessionModal, setSessionModal] = useState<SessionModalState | null>(null);
  const [blockModal, setBlockModal] = useState(false);

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

  const workingProfessionals = useMemo(
    () =>
      professionals
        .filter((p) => p.active && p.defaultSchedule[weekday])
        .sort((a, b) => a.name.localeCompare(b.name)),
    [professionals, weekday]
  );

  const slots = useMemo(() => {
    if (workingProfessionals.length === 0) return [];
    let minStart = Infinity;
    let maxEnd = -Infinity;
    workingProfessionals.forEach((p) => {
      const sched = p.defaultSchedule[weekday]!;
      minStart = Math.min(minStart, timeToMinutes(sched.start));
      maxEnd = Math.max(maxEnd, timeToMinutes(sched.end));
    });
    const result: string[] = [];
    for (let t = minStart; t < maxEnd; t += 30) result.push(minutesToTime(t));
    return result;
  }, [workingProfessionals, weekday]);

  const loading = loadingProfessionals || loadingSessions || loadingBlocks;

  function openCreate(professional: Professional, startTime: string) {
    setSessionModal({ professional, startTime });
  }

  function openEdit(professional: Professional, session: Session) {
    setSessionModal({ professional, startTime: session.startTime, existing: session });
  }

  async function handleRemoveBlock(block: Block) {
    if (confirm(`Remover o bloqueio${block.reason ? ` "${block.reason}"` : ""}?`)) {
      await removeBlock(block.id);
    }
  }

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
      <div className="page-header">
        <div className="agenda-date-nav">
          <button className="btn secondary" onClick={() => setDate((d) => addDays(d, -1))}>
            ← Anterior
          </button>
          <button className="btn secondary" onClick={() => setDate(todayISO())}>
            Hoje
          </button>
          <button className="btn secondary" onClick={() => setDate((d) => addDays(d, 1))}>
            Próximo →
          </button>
        </div>
        {workingProfessionals.length > 0 && (
          <button className="btn" onClick={() => setBlockModal(true)}>
            + Bloquear horário
          </button>
        )}
      </div>

      <h1 className="agenda-date-title">{formatLongDate(date)}</h1>

      {(sessionsError || blocksError) && (
        <div className="error-banner">{sessionsError ?? blocksError}</div>
      )}

      {loading ? (
        <p>Carregando...</p>
      ) : workingProfessionals.length === 0 ? (
        <div className="empty-state">
          Nenhum profissional escalado para este dia. Configure a escala semanal em Profissionais.
        </div>
      ) : (
        <div className="agenda-scroll">
          <div
            className="agenda-grid"
            style={{
              gridTemplateColumns: `72px repeat(${workingProfessionals.length}, minmax(170px, 1fr))`,
              gridTemplateRows: `44px repeat(${slots.length}, 30px)`,
            }}
          >
            <div className="agenda-corner" style={{ gridRow: 1, gridColumn: 1 }} />
            {workingProfessionals.map((p, i) => (
              <div className="agenda-col-header" key={p.id} style={{ gridRow: 1, gridColumn: i + 2 }}>
                {p.name}
              </div>
            ))}

            {slots.map((t, rowIdx) => (
              <div className="agenda-time-label" key={t} style={{ gridRow: rowIdx + 2, gridColumn: 1 }}>
                {t.endsWith(":00") ? t : ""}
              </div>
            ))}

            {workingProfessionals.map((prof, colIdx) => {
              const daySchedule = prof.defaultSchedule[weekday]!;
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
                      <span>{STATUS_LABELS[session.status]}</span>
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
                    Disponível
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
          onClose={() => setSessionModal(null)}
        />
      )}

      {blockModal && (
        <BlockModal
          date={date}
          professionals={workingProfessionals}
          onSave={async (input) => {
            await addBlock(input);
          }}
          onClose={() => setBlockModal(false)}
        />
      )}
    </div>
  );
}
