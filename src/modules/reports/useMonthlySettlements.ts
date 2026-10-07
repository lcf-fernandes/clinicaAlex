import { useEffect, useState } from "react";
import { where } from "firebase/firestore";
import { subscribeCollection } from "../../shared/firestore/crud";
import type { DailySettlement, SettlementAdjustment } from "../../types/settlement";

const COLLECTION = "dailySettlements";

function mapSettlement(_id: string, data: Record<string, unknown>): DailySettlement {
  return {
    professionalId: (data.professionalId as string) ?? "",
    professionalName: (data.professionalName as string) ?? "",
    date: (data.date as string) ?? "",
    adjustments: (data.adjustments as SettlementAdjustment[]) ?? [],
    closedAt: (data.closedAt as { toMillis?: () => number })?.toMillis?.() ?? null,
    sessionsCount: (data.sessionsCount as number) ?? 0,
    grossAmount: (data.grossAmount as number) ?? 0,
    roomCost: (data.roomCost as number) ?? 0,
    feesTotal: (data.feesTotal as number) ?? 0,
    netAmount: (data.netAmount as number) ?? 0,
  };
}

function nextYearMonth(yearMonth: string): string {
  const [y, m] = yearMonth.split("-").map(Number);
  const next = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
  return next;
}

/**
 * Soma só as liquidações já FECHADAS do mês — uma aberta não tem
 * valores confiáveis ainda (ver computeSettlement/DailySettlement).
 * Range de "date" (string "YYYY-MM-DD") num único campo não precisa
 * de índice composto.
 */
export function useMonthlySettlements(yearMonth: string) {
  const [settlements, setSettlements] = useState<DailySettlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const start = `${yearMonth}-01`;
    const end = `${nextYearMonth(yearMonth)}-01`;
    const unsubscribe = subscribeCollection<DailySettlement>(
      COLLECTION,
      mapSettlement,
      (items) => {
        setSettlements(items);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
      [where("date", ">=", start), where("date", "<", end)]
    );
    return unsubscribe;
  }, [yearMonth]);

  const closed = settlements.filter((s) => s.closedAt != null);
  const openDates = Array.from(new Set(settlements.filter((s) => s.closedAt == null).map((s) => s.date)));

  return { settlements: closed, openDates, loading, error };
}
