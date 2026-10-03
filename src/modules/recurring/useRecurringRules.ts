import { useEffect, useState } from "react";
import { createDoc, deleteDocById, subscribeCollection, updateDocById } from "../../shared/firestore/crud";
import type { RecurringException, RecurringRule, RecurringRuleInput } from "../../types/recurringRule";

const COLLECTION = "recurringRules";

function mapRule(id: string, data: Record<string, unknown>): RecurringRule {
  return {
    id,
    patientId: (data.patientId as string) ?? "",
    patientName: (data.patientName as string) ?? "",
    weekday: (data.weekday as RecurringRule["weekday"]) ?? "mon",
    time: (data.time as string) ?? "",
    professionalId: (data.professionalId as string) ?? "",
    professionalName: (data.professionalName as string) ?? "",
    billingProfileId: data.billingProfileId as string | undefined,
    active: (data.active as boolean) ?? true,
    startDate: (data.startDate as string) ?? "",
    endDate: (data.endDate as string | null) ?? null,
    exceptions: (data.exceptions as RecurringException[]) ?? [],
    createdAt: (data.createdAt as { toMillis?: () => number })?.toMillis?.() ?? 0,
  };
}

export function useRecurringRules() {
  const [rules, setRules] = useState<RecurringRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Dataset pequeno (um por paciente fixo) — sem orderBy especial, lista toda.
    const unsubscribe = subscribeCollection<RecurringRule>(
      COLLECTION,
      mapRule,
      (items) => {
        setRules(items.sort((a, b) => a.patientName.localeCompare(b.patientName)));
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

  async function addRule(input: RecurringRuleInput) {
    return createDoc(COLLECTION, input);
  }

  async function updateRule(id: string, input: Partial<RecurringRuleInput>) {
    return updateDocById(COLLECTION, id, input);
  }

  async function removeRule(id: string) {
    return deleteDocById(COLLECTION, id);
  }

  /** Encerra o turno fixo numa data (seção 9 da spec), sem apagar o histórico da regra. */
  async function endRule(id: string, endDate: string) {
    return updateDocById(COLLECTION, id, { active: false, endDate });
  }

  async function addException(rule: RecurringRule, exception: RecurringException) {
    const next = [...rule.exceptions.filter((e) => e.date !== exception.date), exception];
    return updateDocById(COLLECTION, rule.id, { exceptions: next });
  }

  async function removeException(rule: RecurringRule, date: string) {
    const next = rule.exceptions.filter((e) => e.date !== date);
    return updateDocById(COLLECTION, rule.id, { exceptions: next });
  }

  return { rules, loading, error, addRule, updateRule, removeRule, endRule, addException, removeException };
}
