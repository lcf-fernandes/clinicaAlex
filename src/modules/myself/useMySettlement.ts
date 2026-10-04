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

/**
 * Só mostra a liquidação depois que a secretária/admin salvou algo
 * pra aquele dia (fechada ou com ajustes) — o profissional não tem
 * acesso à coleção `professionals` pra calcular um preview ao vivo
 * (ver firestore.rules), então sem o documento não dá pra saber.
 */
export function useMySettlement(professionalId: string, date: string) {
  const [settlement, setSettlement] = useState<DailySettlement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeCollection<DailySettlement>(
      COLLECTION,
      mapSettlement,
      (items) => {
        setSettlement(items[0] ?? null);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
      [where("professionalId", "==", professionalId), where("date", "==", date)]
    );
    return unsubscribe;
  }, [professionalId, date]);

  return { settlement, loading, error };
}
