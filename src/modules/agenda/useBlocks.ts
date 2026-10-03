import { useEffect, useState } from "react";
import { where } from "firebase/firestore";
import { createDoc, deleteDocById, subscribeCollection } from "../../shared/firestore/crud";
import type { Block, BlockInput } from "../../types/session";

const COLLECTION = "blocks";

function mapBlock(id: string, data: Record<string, unknown>): Block {
  return {
    id,
    date: (data.date as string) ?? "",
    professionalId: (data.professionalId as string) ?? "",
    startTime: (data.startTime as string) ?? "",
    endTime: (data.endTime as string) ?? "",
    reason: data.reason as string | undefined,
    createdAt: (data.createdAt as { toMillis?: () => number })?.toMillis?.() ?? 0,
  };
}

export function useBlocks(date: string) {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeCollection<Block>(
      COLLECTION,
      mapBlock,
      (items) => {
        setBlocks(items);
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

  async function addBlock(input: BlockInput) {
    return createDoc(COLLECTION, input);
  }

  async function removeBlock(id: string) {
    return deleteDocById(COLLECTION, id);
  }

  return { blocks, loading, error, addBlock, removeBlock };
}
