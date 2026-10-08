import { useEffect, useState } from "react";
import { limit, orderBy } from "firebase/firestore";
import { subscribeCollection } from "../../shared/firestore/crud";
import type { AuditLogEntry } from "../../types/auditLog";

function mapEntry(id: string, data: Record<string, unknown>): AuditLogEntry {
  return {
    id,
    userId: (data.userId as string) ?? "",
    username: (data.username as string) ?? "",
    action: (data.action as string) ?? "",
    summary: (data.summary as string) ?? "",
    createdAt: (data.createdAt as { toMillis?: () => number })?.toMillis?.() ?? 0,
  };
}

/** Últimas 300 ações, mais recentes primeiro. */
export function useAuditLog() {
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeCollection<AuditLogEntry>(
      "auditLog",
      mapEntry,
      (items) => {
        setEntries(items);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
      [orderBy("createdAt", "desc"), limit(300)]
    );
    return unsubscribe;
  }, []);

  return { entries, loading, error };
}
