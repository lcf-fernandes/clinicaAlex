import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  type QueryConstraint,
} from "firebase/firestore";
import { db } from "../../firebase/config";

/**
 * Assina uma coleção do Firestore em tempo real e devolve uma função de
 * cancelamento. `mapDoc` converte cada documento no tipo da aplicação.
 */
export function subscribeCollection<T>(
  collectionName: string,
  mapDoc: (id: string, data: Record<string, unknown>) => T,
  onData: (items: T[]) => void,
  onError: (error: Error) => void,
  constraints: QueryConstraint[] = [orderBy("createdAt", "desc")]
) {
  const q = query(collection(db, collectionName), ...constraints);
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((d) => mapDoc(d.id, d.data()));
      onData(items);
    },
    (error) => onError(error as Error)
  );
}

export async function createDoc(
  collectionName: string,
  data: Record<string, unknown>
) {
  const ref = await addDoc(collection(db, collectionName), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateDocById(
  collectionName: string,
  id: string,
  data: Record<string, unknown>
) {
  await updateDoc(doc(db, collectionName, id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteDocById(collectionName: string, id: string) {
  await deleteDoc(doc(db, collectionName, id));
}
