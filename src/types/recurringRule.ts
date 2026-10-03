import type { Weekday } from "./professional";

export type RecurringExceptionAction = "cancel" | "reassign" | "reschedule";

export interface RecurringException {
  date: string; // "2026-08-31"
  action: RecurringExceptionAction;
  /** Só pra "reassign": outro profissional nesse dia específico. */
  newProfessionalId?: string;
  newProfessionalName?: string;
  /** Só pra "reschedule": outro horário nesse dia específico. */
  newTime?: string;
  note?: string;
}

export interface RecurringRule {
  id: string;
  patientId: string;
  patientName: string;
  weekday: Weekday;
  time: string; // "08:00"
  professionalId: string;
  professionalName: string;
  billingProfileId?: string;
  active: boolean;
  startDate: string;
  endDate: string | null; // preenchido quando o paciente para de vir (seção 9 da spec)
  exceptions: RecurringException[];
  createdAt: number;
}

export type RecurringRuleInput = Omit<RecurringRule, "id" | "createdAt">;
