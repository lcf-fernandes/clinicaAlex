import { useEffect, useState } from "react";
import {
  createDoc,
  deleteDocById,
  subscribeCollection,
  updateDocById,
} from "../../shared/firestore/crud";
import type { Professional, ProfessionalInput } from "../../types/professional";

const COLLECTION = "professionals";

function mapProfessional(id: string, data: Record<string, unknown>): Professional {
  return {
    id,
    name: (data.name as string) ?? "",
    active: (data.active as boolean) ?? true,
    defaultSchedule: (data.defaultSchedule as Professional["defaultSchedule"]) ?? {},
    sessionRate: (data.sessionRate as number) ?? 0,
    roomCost: (data.roomCost as number) ?? 0,
    perSessionFee: (data.perSessionFee as number) ?? 0,
    createdAt: (data.createdAt as { toMillis?: () => number })?.toMillis?.() ?? 0,
    updatedAt: (data.updatedAt as { toMillis?: () => number })?.toMillis?.() ?? 0,
  };
}

export function useProfessionals() {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeCollection<Professional>(
      COLLECTION,
      mapProfessional,
      (items) => {
        setProfessionals(items);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );
    return unsubscribe;
  }, []);

  async function addProfessional(input: ProfessionalInput) {
    return createDoc(COLLECTION, input);
  }

  async function updateProfessional(id: string, input: Partial<ProfessionalInput>) {
    return updateDocById(COLLECTION, id, input);
  }

  async function removeProfessional(id: string) {
    return deleteDocById(COLLECTION, id);
  }

  return { professionals, loading, error, addProfessional, updateProfessional, removeProfessional };
}
