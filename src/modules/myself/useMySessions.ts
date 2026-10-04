import { useEffect, useState } from "react";
import { where } from "firebase/firestore";
import { subscribeCollection } from "../../shared/firestore/crud";
import type { Session } from "../../types/session";

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
 * Só leitura, e só do próprio profissional — a regra do Firestore
 * exige que toda query aqui já venha filtrada por professionalId
 * (ver firestore.rules), senão a consulta inteira é negada.
 */
export function useMySessions(professionalId: string, date: string) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeCollection<Session>(
      COLLECTION,
      mapSession,
      (items) => {
        setSessions(items.sort((a, b) => a.startTime.localeCompare(b.startTime)));
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

  return { sessions, loading, error };
}
