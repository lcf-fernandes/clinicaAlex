import { useEffect, useState } from "react";
import { createDoc, deleteDocById, subscribeCollection, updateDocById } from "../../shared/firestore/crud";
import type { WaitlistEntry, WaitlistEntryInput, WaitlistStatus } from "../../types/waitlistEntry";

const COLLECTION = "waitlist";

function mapEntry(id: string, data: Record<string, unknown>): WaitlistEntry {
  return {
    id,
    patientId: (data.patientId as string) ?? "",
    patientName: (data.patientName as string) ?? "",
    preferredTime: (data.preferredTime as WaitlistEntry["preferredTime"]) ?? "cualquiera",
    preferredProfessionalId: data.preferredProfessionalId as string | undefined,
    preferredProfessionalName: data.preferredProfessionalName as string | undefined,
    preferredDays: (data.preferredDays as WaitlistEntry["preferredDays"]) ?? [],
    observation: data.observation as string | undefined,
    status: (data.status as WaitlistStatus) ?? "esperando",
    createdAt: (data.createdAt as { toMillis?: () => number })?.toMillis?.() ?? 0,
  };
}

export function useWaitlist() {
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeCollection<WaitlistEntry>(
      COLLECTION,
      mapEntry,
      (items) => {
        setEntries(items);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
      []
    );
    return unsubscribe;
  }, []);

  async function addEntry(input: WaitlistEntryInput) {
    return createDoc(COLLECTION, input);
  }

  async function setStatus(id: string, status: WaitlistStatus) {
    return updateDocById(COLLECTION, id, { status });
  }

  async function removeEntry(id: string) {
    return deleteDocById(COLLECTION, id);
  }

  return { entries, loading, error, addEntry, setStatus, removeEntry };
}
