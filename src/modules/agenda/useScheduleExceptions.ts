import { useEffect, useState } from "react";
import { where } from "firebase/firestore";
import { createDoc, deleteDocById, subscribeCollection } from "../../shared/firestore/crud";
import type { ScheduleException, ScheduleExceptionInput } from "../../types/scheduleException";

const COLLECTION = "scheduleExceptions";

function mapException(id: string, data: Record<string, unknown>): ScheduleException {
  return {
    id,
    professionalId: (data.professionalId as string) ?? "",
    professionalName: (data.professionalName as string) ?? "",
    date: (data.date as string) ?? "",
    reason: data.reason as string | undefined,
    replacementProfessionalId: data.replacementProfessionalId as string | undefined,
    replacementProfessionalName: data.replacementProfessionalName as string | undefined,
    createdAt: (data.createdAt as { toMillis?: () => number })?.toMillis?.() ?? 0,
  };
}

export function useScheduleExceptions(date: string) {
  const [exceptions, setExceptions] = useState<ScheduleException[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeCollection<ScheduleException>(
      COLLECTION,
      mapException,
      (items) => {
        setExceptions(items);
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

  async function addException(input: ScheduleExceptionInput) {
    return createDoc(COLLECTION, input);
  }

  async function removeException(id: string) {
    return deleteDocById(COLLECTION, id);
  }

  return { exceptions, loading, error, addException, removeException };
}
