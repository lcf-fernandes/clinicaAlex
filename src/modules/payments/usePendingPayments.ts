import { useEffect, useState } from "react";
import { where } from "firebase/firestore";
import { subscribeCollection, updateDocById } from "../../shared/firestore/crud";
import type { Session, SessionPayment } from "../../types/session";

const COLLECTION = "sessions";

function mapSession(id: string, data: Record<string, unknown>): Session {
  return {
    id,
    date: (data.date as string) ?? "",
    startTime: (data.startTime as string) ?? "",
    durationMinutes: (data.durationMinutes as number) ?? 60,
    professionalId: (data.professionalId as string) ?? "",
    professionalName: (data.professionalName as string) ?? "",
    patientId: (data.patientId as string) ?? "",
    patientName: (data.patientName as string) ?? "",
    billingProfileId: data.billingProfileId as string | undefined,
    status: (data.status as Session["status"]) ?? "agendado",
    payment: data.payment as Session["payment"],
    notes: data.notes as string | undefined,
    createdAt: (data.createdAt as { toMillis?: () => number })?.toMillis?.() ?? 0,
    updatedAt: (data.updatedAt as { toMillis?: () => number })?.toMillis?.() ?? 0,
  };
}

/** Todas as sessões com payment.method == "pendiente", de qualquer data. */
export function usePendingPayments() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeCollection<Session>(
      COLLECTION,
      mapSession,
      (items) => {
        const sorted = [...items].sort((a, b) => a.date.localeCompare(b.date));
        setSessions(sorted);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
      [where("payment.method", "==", "pendiente")]
    );
    return unsubscribe;
  }, []);

  async function markPaid(sessionId: string, payment: SessionPayment) {
    return updateDocById(COLLECTION, sessionId, { payment });
  }

  return { sessions, loading, error, markPaid };
}
