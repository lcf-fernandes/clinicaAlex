import { useEffect, useRef } from "react";
import type { Weekday } from "../../types/professional";
import type { RecurringRule } from "../../types/recurringRule";
import { occupiesSlot, rangesOverlap, timeToMinutes, type Block, type Session, type SessionInput } from "../../types/session";

interface Params {
  date: string;
  weekday: Weekday;
  rules: RecurringRule[];
  rulesLoading: boolean;
  sessions: Session[];
  sessionsLoading: boolean;
  blocks: Block[];
  blocksLoading: boolean;
  addSession: (input: SessionInput) => Promise<string>;
}

/**
 * Sem Cloud Function agendada (ver README) ainda, então a geração do
 * turno de um paciente fixo acontece de forma preguiçosa: na primeira
 * vez que a Agenda é aberta para aquele dia, verificamos as regras
 * ativas daquele dia da semana e criamos a sessão correspondente, se
 * ainda não existir (idempotente — não duplica se rodar de novo).
 */
export function useAutoGenerateRecurringSessions({
  date,
  weekday,
  rules,
  rulesLoading,
  sessions,
  sessionsLoading,
  blocks,
  blocksLoading,
  addSession,
}: Params) {
  const processedRef = useRef<string | null>(null);

  useEffect(() => {
    if (rulesLoading || sessionsLoading || blocksLoading) return;
    if (processedRef.current === date) return;
    processedRef.current = date;

    const applicable = rules.filter((r) => {
      if (!r.active) return false;
      if (r.weekday !== weekday) return false;
      if (r.startDate && r.startDate > date) return false;
      if (r.endDate && r.endDate < date) return false;
      return true;
    });

    if (applicable.length === 0) return;

    (async () => {
      for (const rule of applicable) {
        const alreadyExists = sessions.some((s) => s.recurringRuleId === rule.id && s.date === date);
        if (alreadyExists) continue;

        const exception = rule.exceptions.find((e) => e.date === date);
        if (exception?.action === "cancel") continue;

        const professionalId =
          exception?.action === "reassign" && exception.newProfessionalId
            ? exception.newProfessionalId
            : rule.professionalId;
        const professionalName =
          exception?.action === "reassign" && exception.newProfessionalName
            ? exception.newProfessionalName
            : rule.professionalName;
        const startTime =
          exception?.action === "reschedule" && exception.newTime ? exception.newTime : rule.time;

        // Horário já ocupado por outra coisa nesse dia (ex.: a secretária
        // já agendou outro paciente ali manualmente) — não gera por
        // cima, deixa pra ela resolver na mão.
        const conflict =
          sessions.some(
            (s) =>
              occupiesSlot(s.status) &&
              s.professionalId === professionalId &&
              rangesOverlap(startTime, 60, s.startTime, s.durationMinutes)
          ) ||
          blocks.some(
            (b) =>
              b.professionalId === professionalId &&
              rangesOverlap(startTime, 60, b.startTime, timeToMinutes(b.endTime) - timeToMinutes(b.startTime))
          );
        if (conflict) continue;

        await addSession({
          date,
          professionalId,
          professionalName,
          startTime,
          durationMinutes: 60,
          patientId: rule.patientId,
          patientName: rule.patientName,
          billingProfileId: rule.billingProfileId,
          status: "agendado",
          recurringRuleId: rule.id,
        });
      }
    })();
  }, [date, weekday, rules, rulesLoading, sessions, sessionsLoading, blocks, blocksLoading, addSession]);
}
