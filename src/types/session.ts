export type SessionStatus = "agendado" | "asistio" | "cancelo_aviso" | "no_asistio_sin_aviso";

export type PaymentMethod = "efectivo" | "transferencia" | "cheque" | "pendiente";

export interface SessionPayment {
  method: PaymentMethod;
  amount: number;
}

export interface Session {
  id: string;
  date: string; // "2026-10-02"
  startTime: string; // "08:00"
  durationMinutes: number; // 60 (padrão) ou 120 (sessão dupla, item 18 da spec)
  professionalId: string;
  professionalName: string; // guardado junto, útil pro histórico do paciente (que cruza vários profissionais)
  patientId: string;
  patientName: string; // guardado junto pra não precisar buscar o paciente toda hora na grade
  billingProfileId?: string;
  status: SessionStatus;
  payment?: SessionPayment;
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export type SessionInput = Omit<Session, "id" | "createdAt" | "updatedAt">;

export interface Block {
  id: string;
  date: string;
  professionalId: string;
  startTime: string;
  endTime: string;
  reason?: string;
  createdAt: number;
}

export type BlockInput = Omit<Block, "id" | "createdAt">;

export const STATUS_LABELS: Record<SessionStatus, string> = {
  agendado: "Agendado",
  asistio: "Asistió",
  cancelo_aviso: "Canceló — avisó",
  no_asistio_sin_aviso: "No asistió — sin aviso",
};

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  cheque: "Cheque",
  pendiente: "Pendiente",
};

/** Minutos desde 00:00, pra comparar/ordenar horários tipo "08:30". */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0");
  const m = (minutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

/** Dois intervalos [start, start+duration) se sobrepõem? */
export function rangesOverlap(
  startA: string,
  durationA: number,
  startB: string,
  durationB: number
): boolean {
  const a1 = timeToMinutes(startA);
  const a2 = a1 + durationA;
  const b1 = timeToMinutes(startB);
  const b2 = b1 + durationB;
  return a1 < b2 && b1 < a2;
}
