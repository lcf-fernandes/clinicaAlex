import { useEffect, useState } from "react";
import { where } from "firebase/firestore";
import {
  createDoc,
  deleteDocById,
  subscribeCollection,
  updateDocById,
} from "../../shared/firestore/crud";
import type { Session, SessionInput } from "../../types/session";

const COLLECTION = "sessions";

function mapSession(id: string, data: Record<string, unknown>): Session {
  return {
    id,
    date: (data.date as string) ?? "",
    startTime: (data.startTime as string) ?? "",
    durationMinutes: (data.durationMinutes as number) ?? 60,
    professionalId: (data.professionalId as string) ?? "",
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

export function useSessions(date: string) {
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
      [where("date", "==", date)]
    );
    return unsubscribe;
  }, [date]);

  async function addSession(input: SessionInput) {
    return createDoc(COLLECTION, input);
  }

  async function updateSession(id: string, input: Partial<SessionInput>) {
    return updateDocById(COLLECTION, id, input);
  }

  async function removeSession(id: string) {
    return deleteDocById(COLLECTION, id);
  }

  return { sessions, loading, error, addSession, updateSession, removeSession };
}
