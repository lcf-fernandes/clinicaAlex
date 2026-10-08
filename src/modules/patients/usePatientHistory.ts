import { useEffect, useState } from "react";
import { where } from "firebase/firestore";
import { subscribeCollection, updateDocById } from "../../shared/firestore/crud";
import { logActivity } from "../../shared/audit/logActivity";
import { PAYMENT_LABELS } from "../../types/session";
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

/**
 * Sem orderBy de propósito: ordenar por data exigiria um índice
 * composto (patientId == X + orderBy date), já que são campos
 * diferentes. Como o volume por paciente é pequeno, ordena no client.
 */
export function usePatientHistory(patientId: string | null) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!patientId) {
      setSessions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsubscribe = subscribeCollection<Session>(
      COLLECTION,
      mapSession,
      (items) => {
        const sorted = [...items].sort((a, b) =>
          b.date === a.date ? b.startTime.localeCompare(a.startTime) : b.date.localeCompare(a.date)
        );
        setSessions(sorted);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
      [where("patientId", "==", patientId)]
    );
    return unsubscribe;
  }, [patientId]);

  async function markPaid(sessionId: string, payment: SessionPayment) {
    const session = sessions.find((s) => s.id === sessionId);
    await updateDocById(COLLECTION, sessionId, { payment });
    logActivity(
      "payment.mark_paid",
      `Marcó como pagado: ${session?.patientName ?? "?"} (${session?.date.split("-").reverse().join("/") ?? "?"} ${session?.startTime ?? ""}) — ${PAYMENT_LABELS[payment.method]} ${payment.amount.toLocaleString("es-PY")} Gs`
    );
  }

  return { sessions, loading, error, markPaid };
}
