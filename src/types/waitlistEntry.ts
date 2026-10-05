import type { Weekday } from "./professional";
import { timeToMinutes } from "./session";

export type PreferredTime = "manana" | "tarde" | "cualquiera";
export type WaitlistStatus = "esperando" | "convertido" | "descartado";

export const PREFERRED_TIME_LABELS: Record<PreferredTime, string> = {
  manana: "Mañana",
  tarde: "Tarde",
  cualquiera: "Cualquier horario",
};

export interface WaitlistEntry {
  id: string;
  patientId: string;
  patientName: string;
  preferredTime: PreferredTime;
  preferredProfessionalId?: string;
  preferredProfessionalName?: string;
  preferredDays: Weekday[]; // vazio = qualquer dia
  observation?: string;
  status: WaitlistStatus;
  createdAt: number;
}

export type WaitlistEntryInput = Omit<WaitlistEntry, "id" | "createdAt">;

/** A partir daqui, "tarde" começa às 12:00 — simples e previsível o bastante pra uso interno. */
function periodOf(time: string): "manana" | "tarde" {
  return timeToMinutes(time) < 12 * 60 ? "manana" : "tarde";
}

/** O paciente da lista de espera aceitaria esse horário liberado? (item 22 da especificação) */
export function matchesSlot(
  entry: WaitlistEntry,
  professionalId: string,
  weekday: Weekday,
  startTime: string
): boolean {
  if (entry.status !== "esperando") return false;
  if (entry.preferredProfessionalId && entry.preferredProfessionalId !== professionalId) return false;
  if (entry.preferredDays.length > 0 && !entry.preferredDays.includes(weekday)) return false;
  if (entry.preferredTime !== "cualquiera" && entry.preferredTime !== periodOf(startTime)) return false;
  return true;
}
