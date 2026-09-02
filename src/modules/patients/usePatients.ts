import { useEffect, useState } from "react";
import {
  createDoc,
  deleteDocById,
  subscribeCollection,
  updateDocById,
} from "../../shared/firestore/crud";
import type { Patient, PatientInput } from "../../types/patient";

const COLLECTION = "patients";

function mapPatient(id: string, data: Record<string, unknown>): Patient {
  return {
    id,
    fullName: (data.fullName as string) ?? "",
    phone: (data.phone as string) ?? "",
    billingProfiles: (data.billingProfiles as Patient["billingProfiles"]) ?? [],
    notes: (data.notes as string) ?? "",
    createdAt: (data.createdAt as { toMillis?: () => number })?.toMillis?.() ?? 0,
    updatedAt: (data.updatedAt as { toMillis?: () => number })?.toMillis?.() ?? 0,
  };
}

export function usePatients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeCollection<Patient>(
      COLLECTION,
      mapPatient,
      (items) => {
        setPatients(items);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );
    return unsubscribe;
  }, []);

  async function addPatient(input: PatientInput) {
    return createDoc(COLLECTION, input);
  }

  async function updatePatient(id: string, input: Partial<PatientInput>) {
    return updateDocById(COLLECTION, id, input);
  }

  async function removePatient(id: string) {
    return deleteDocById(COLLECTION, id);
  }

  return { patients, loading, error, addPatient, updatePatient, removePatient };
}
