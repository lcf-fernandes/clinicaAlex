export type Weekday = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export interface DaySchedule {
  start: string; // "07:00"
  end: string; // "17:00"
  room: string; // "Sala 1"
}

export type WeeklySchedule = Partial<Record<Weekday, DaySchedule>>;

export interface Professional {
  id: string;
  name: string;
  active: boolean;
  defaultSchedule: WeeklySchedule;
  sessionRate: number; // valor cobrado por sessão (Gs)
  roomCost: number; // custo de sala por dia trabalhado (Gs)
  perSessionFee: number; // taxa por sessão (Gs)
  createdAt: number;
  updatedAt: number;
}

export type ProfessionalInput = Omit<
  Professional,
  "id" | "createdAt" | "updatedAt"
>;

export const WEEKDAYS: { key: Weekday; label: string }[] = [
  { key: "mon", label: "Segunda" },
  { key: "tue", label: "Terça" },
  { key: "wed", label: "Quarta" },
  { key: "thu", label: "Quinta" },
  { key: "fri", label: "Sexta" },
  { key: "sat", label: "Sábado" },
  { key: "sun", label: "Domingo" },
];
