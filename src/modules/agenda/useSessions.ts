import { useEffect, useState } from "react";
import { where } from "firebase/firestore";
import {
  createDoc,
  deleteDocById,
  subscribeCollection,
  updateDocById,
} from "../../shared/firestore/crud";
import { logActivity } from "../../shared/audit/logActivity";
import { PAYMENT_LABELS, STATUS_LABELS, type Session, type SessionInput } from "../../types/session";

function fmtDate(iso: string) {
  return iso.split("-").reverse().join("/");
}

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
    const id = await createDoc(COLLECTION, input);
    // Sessões geradas automaticamente de paciente fixo também passam
    // por aqui — o resumo deixa isso claro.
    logActivity(
      input.recurringRuleId ? "session.auto_create" : "session.create",
      `${input.recurringRuleId ? "Se generó automáticamente" : "Creó"} la sesión de ${input.patientName} con ${input.professionalName} (${input.startTime}, ${fmtDate(input.date)})`
    );
    return id;
  }

  async function updateSession(id: string, input: Partial<SessionInput>) {
    const before = sessions.find((s) => s.id === id);
    await updateDocById(COLLECTION, id, input);
    const patient = input.patientName ?? before?.patientName ?? "?";
    const when = `${input.startTime ?? before?.startTime ?? "?"}, ${fmtDate(input.date ?? before?.date ?? date)}`;
    const changes: string[] = [];
    if (input.status && input.status !== before?.status) changes.push(`estado → ${STATUS_LABELS[input.status]}`);
    if (input.payment && JSON.stringify(input.payment) !== JSON.stringify(before?.payment)) {
      changes.push(`pago → ${PAYMENT_LABELS[input.payment.method]} ${input.payment.amount.toLocaleString("es-PY")} Gs`);
    }
    if (input.professionalName && input.professionalName !== before?.professionalName) {
      changes.push(`profesional → ${input.professionalName}`);
    }
    logActivity(
      "session.update",
      `Editó la sesión de ${patient} (${when})${changes.length ? ": " + changes.join(", ") : ""}`
    );
  }

  async function removeSession(id: string) {
    const before = sessions.find((s) => s.id === id);
    await deleteDocById(COLLECTION, id);
    logActivity(
      "session.delete",
      `Eliminó la sesión de ${before?.patientName ?? "?"} con ${before?.professionalName ?? "?"} (${before?.startTime ?? "?"}, ${fmtDate(before?.date ?? date)})`
    );
  }

  return { sessions, loading, error, addSession, updateSession, removeSession };
}
