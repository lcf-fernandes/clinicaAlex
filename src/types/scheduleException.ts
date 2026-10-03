/**
 * Ausência pontual de um profissional num dia, com reemplazo opcional
 * (item 11 da especificação). Não mexe na escala permanente
 * (Professional.defaultSchedule) — é só uma exceção daquele dia,
 * seguindo o mesmo padrão de "regra permanente + exceção por data"
 * usado em RecurringRule.
 */
export interface ScheduleException {
  id: string;
  professionalId: string;
  professionalName: string;
  date: string;
  reason?: string;
  replacementProfessionalId?: string;
  replacementProfessionalName?: string;
  createdAt: number;
}

export type ScheduleExceptionInput = Omit<ScheduleException, "id" | "createdAt">;
