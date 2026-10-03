import { useEffect, useState } from "react";
import { serverTimestamp, where } from "firebase/firestore";
import { setDocById, subscribeCollection } from "../../shared/firestore/crud";
import type { DailySettlement, SettlementAdjustment, SettlementCalculation } from "../../types/settlement";

const COLLECTION = "dailySettlements";

function docId(professionalId: string, date: string) {
  return `${professionalId}_${date}`;
}

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

export function useSettlements(date: string) {
  const [settlements, setSettlements] = useState<DailySettlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
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
      [where("date", "==", date)]
    );
    return unsubscribe;
  }, [date]);

  /** Salva só os ajustes manuais, sem fechar o dia — mantém editável. */
  async function saveAdjustments(
    professionalId: string,
    professionalName: string,
    adjustments: SettlementAdjustment[]
  ) {
    return setDocById(COLLECTION, docId(professionalId, date), {
      professionalId,
      professionalName,
      date,
      adjustments,
      closedAt: null,
    });
  }

  /** Grava o snapshot final (os números não mudam mais mesmo que a agenda seja corrigida depois). */
  async function closeSettlement(
    professionalId: string,
    professionalName: string,
    adjustments: SettlementAdjustment[],
    calc: SettlementCalculation
  ) {
    return setDocById(COLLECTION, docId(professionalId, date), {
      professionalId,
      professionalName,
      date,
      adjustments,
      sessionsCount: calc.sessionsCount,
      grossAmount: calc.grossAmount,
      roomCost: calc.roomCost,
      feesTotal: calc.feesTotal,
      netAmount: calc.netAmount,
      closedAt: serverTimestamp(),
    });
  }

  /** Reabre pra corrigir — os valores voltam a ser recalculados ao vivo até fechar de novo. */
  async function reopenSettlement(professionalId: string, professionalName: string, adjustments: SettlementAdjustment[]) {
    return setDocById(COLLECTION, docId(professionalId, date), {
      professionalId,
      professionalName,
      date,
      adjustments,
      closedAt: null,
    });
  }

  return { settlements, loading, error, saveAdjustments, closeSettlement, reopenSettlement };
}
