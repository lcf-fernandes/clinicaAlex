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
import {
  minutesToTime,
  occupiesSlot,
  rangesOverlap,
  timeToMinutes,
  STATUS_LABELS,
  type Session,
  type Block,
} from "../../types/session";
import type { Professional } from "../../types/professional";

// A grade tem uma linha a cada 5 minutos (6 linhas = uma casinha de 30min),
// pra uma sessão poder começar em qualquer horário (ex.: 09:15) sem
// "sumir" por não bater com uma linha de 30 em 30.
const SLOT_MIN = 30;
const ROW_MIN = 5;
const ROWS_PER_SLOT = SLOT_MIN / ROW_MIN;
const ROW_PX = 5;

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
      (s) =>
        s.professionalId === sessionModal.professional.id &&
        s.id !== sessionModal.existing?.id &&
        occupiesSlot(s.status)
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
          sessions={sessions.filter((s) => s.professionalId === ex.professionalId && occupiesSlot(s.status))}
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
              gridTemplateRows: `44px repeat(${slots.length * ROWS_PER_SLOT}, ${ROW_PX}px)`,
            }}
          >
            <div className="agenda-corner" style={{ gridRow: 1, gridColumn: 1 }} />
            {columns.map((col, i) => (
              <div className="agenda-col-header" key={col.professional.id} style={{ gridRow: 1, gridColumn: i + 2 }}>
                {col.professional.name}
              </div>
            ))}

            {slots.map((t, slotIdx) => (
              <div
                className="agenda-time-label"
                key={t}
                style={{ gridRow: `${slotIdx * ROWS_PER_SLOT + 2} / span ${ROWS_PER_SLOT}`, gridColumn: 1 }}
              >
                {t.endsWith(":00") ? t : ""}
              </div>
            ))}

            {columns.map((col, colIdx) => {
              const prof = col.professional;
              const gridColumn = colIdx + 2;
              const schedStart = timeToMinutes(col.schedule.start);
              const schedEnd = timeToMinutes(col.schedule.end);
              const gridStartMin = timeToMinutes(slots[0]);
              const gridEndMin = gridStartMin + slots.length * SLOT_MIN;
              const rowOf = (min: number) => Math.round((min - gridStartMin) / ROW_MIN) + 2;

              const profSessions = sessions.filter((s) => s.professionalId === prof.id);
              const activeSessions = profSessions.filter((s) => occupiesSlot(s.status));
              const freedSessions = profSessions.filter((s) => !occupiesSlot(s.status));
              const profBlocks = blocks.filter((b) => b.professionalId === prof.id);
              const blockDuration = (b: Block) => timeToMinutes(b.endTime) - timeToMinutes(b.startTime);

              // Camada de fundo: uma casinha por 30min (fora do expediente,
              // coberta por algo, ou disponível pra clicar).
              const background = slots.map((t, slotIdx) => {
                const tMin = timeToMinutes(t);
                const gridRow = `${slotIdx * ROWS_PER_SLOT + 2} / span ${ROWS_PER_SLOT}`;

                if (tMin + SLOT_MIN <= schedStart || tMin >= schedEnd) {
                  return (
                    <div key={`bg-${t}`} className="agenda-cell agenda-cell-outside" style={{ gridRow, gridColumn }} />
                  );
                }

                const covered =
                  activeSessions.some((s) => rangesOverlap(t, SLOT_MIN, s.startTime, s.durationMinutes)) ||
                  profBlocks.some((b) => rangesOverlap(t, SLOT_MIN, b.startTime, blockDuration(b)));
                if (covered) {
                  return <div key={`bg-${t}`} className="agenda-cell" style={{ gridRow, gridColumn }} />;
                }

                // Sessão cancelada / faltou sem aviso: o horário está livre,
                // mas o registro continua visível aqui (e editável).
                const freed = freedSessions.find(
                  (s) => timeToMinutes(s.startTime) >= tMin && timeToMinutes(s.startTime) < tMin + SLOT_MIN
                );
                if (freed) {
                  return (
                    <div
                      key={`bg-${t}`}
                      className="agenda-cell agenda-cell-available agenda-cell-freed"
                      style={{ gridRow, gridColumn }}
                    >
                      <button type="button" className="freed-main" onClick={() => openCreate(prof, t)}>
                        <span>Disponible</span>
                        <small>
                          {STATUS_LABELS[freed.status]}: {freed.patientName}
                        </small>
                      </button>
                      <button
                        type="button"
                        className="freed-edit"
                        title="Editar la sesión cancelada"
                        onClick={() => openEdit(prof, freed)}
                      >
                        ✎
                      </button>
                    </div>
                  );
                }

                return (
                  <button
                    key={`bg-${t}`}
                    type="button"
                    className="agenda-cell agenda-cell-available"
                    style={{ gridRow, gridColumn }}
                    onClick={() => openCreate(prof, t)}
                  >
                    Disponible
                  </button>
                );
              });

              // Camada de cima: bloqueios e sessões posicionados pelo minuto
              // exato de início/fim, sobrepondo o fundo. Sessão fica acima
              // do bloqueio (uma sessão nunca fica escondida atrás de um).
              const overlay = (
                startMin: number,
                endMin: number
              ): { gridRow: string; gridColumn: number } | null => {
                const startRow = rowOf(Math.max(startMin, gridStartMin));
                const endRow = rowOf(Math.min(endMin, gridEndMin));
                if (endRow <= startRow) return null;
                return { gridRow: `${startRow} / ${endRow}`, gridColumn };
              };

              const blockCells = profBlocks.map((b) => {
                const style = overlay(timeToMinutes(b.startTime), timeToMinutes(b.endTime));
                if (!style) return null;
                return (
                  <button
                    key={`b-${b.id}`}
                    type="button"
                    className="agenda-cell agenda-cell-blocked agenda-block"
                    style={style}
                    onClick={() => handleRemoveBlock(b)}
                  >
                    Bloqueado{b.reason ? ` — ${b.reason}` : ""}
                  </button>
                );
              });

              const sessionCells = activeSessions.map((s) => {
                const startMin = timeToMinutes(s.startTime);
                const style = overlay(startMin, startMin + s.durationMinutes);
                if (!style) return null;
                return (
                  <button
                    key={`s-${s.id}`}
                    type="button"
                    className={`agenda-cell agenda-session status-${s.status}`}
                    style={style}
                    onClick={() => openEdit(prof, s)}
                  >
                    <strong>{s.patientName}</strong>
                    <span>
                      {STATUS_LABELS[s.status]}
                      {s.scheduledProfessionalName && ` · reemplazo de ${s.scheduledProfessionalName}`}
                    </span>
                  </button>
                );
              });

              return [...background, ...blockCells, ...sessionCells];
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
          sessions={sessions.filter((s) => occupiesSlot(s.status))}
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
