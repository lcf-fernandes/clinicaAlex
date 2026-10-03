import type { Professional } from "./professional";
import type { Session } from "./session";

export interface SettlementAdjustment {
  id: string;
  concept: string;
  amount: number;
}

export interface DailySettlement {
  professionalId: string;
  professionalName: string;
  date: string;
  adjustments: SettlementAdjustment[];
  closedAt: number | null;
  // Só têm valor confiável depois de fechada (closedAt != null) — ver computeSettlement.
  sessionsCount: number;
  grossAmount: number;
  roomCost: number;
  feesTotal: number;
  netAmount: number;
}

export interface SettlementCalculation {
  sessionsCount: number; // "unidades" de 1h (sessão de 120min conta como 2 — item 18)
  grossAmount: number;
  roomCost: number;
  feesTotal: number;
  adjustmentsTotal: number;
  netAmount: number;
}

/**
 * Conta por bloco de 60min realmente realizado (status "asistio"), não
 * por paciente — uma sessão de 120min vale 2 unidades tanto no bruto
 * quanto na taxa (item 18 da especificação). Liquidação é de quem
 * realizou de fato (session.professionalId), não do profissional
 * habitual original de um reemplazo (session.scheduledProfessionalId).
 */
export function computeSettlement(
  professional: Pick<Professional, "sessionRate" | "roomCost" | "perSessionFee">,
  attendedSessions: Pick<Session, "durationMinutes">[],
  adjustments: SettlementAdjustment[]
): SettlementCalculation {
  const sessionsCount = attendedSessions.reduce((sum, s) => sum + s.durationMinutes / 60, 0);
  const grossAmount = sessionsCount * professional.sessionRate;
  const feesTotal = sessionsCount * professional.perSessionFee;
  const adjustmentsTotal = adjustments.reduce((sum, a) => sum + a.amount, 0);
  const netAmount = grossAmount - professional.roomCost - feesTotal - adjustmentsTotal;
  return {
    sessionsCount,
    grossAmount,
    roomCost: professional.roomCost,
    feesTotal,
    adjustmentsTotal,
    netAmount,
  };
}
