import { useEffect, useState } from "react";
import { orderBy } from "firebase/firestore";
import { deleteDocById, subscribeCollection, updateDocById } from "../../shared/firestore/crud";
import { DEFAULT_PERMISSIONS, type UserProfile } from "../../types/user";
import { logActivity } from "../../shared/audit/logActivity";

const COLLECTION = "users";

function mapUser(id: string, data: Record<string, unknown>): UserProfile {
  const role = (data.role as UserProfile["role"]) ?? "secretary";
  return {
    uid: id,
    username: (data.username as string) ?? "",
    role,
    permissions: (data.permissions as UserProfile["permissions"]) ?? DEFAULT_PERMISSIONS[role],
    active: (data.active as boolean) ?? true,
  };
}

export function useUsers() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Documentos criados manualmente no Console não têm `createdAt`,
    // então não dá pra ordenar por ele (ficaria sem resultado). Ordena
    // por username, que sempre existe.
    const unsubscribe = subscribeCollection<UserProfile>(
      COLLECTION,
      mapUser,
      (items) => {
        setUsers(items);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
      [orderBy("username")]
    );
    return unsubscribe;
  }, []);

  async function setActive(uid: string, active: boolean) {
    // updateDocById escreve updatedAt via serverTimestamp(), o que é
    // inofensivo mesmo em documentos que não tinham esse campo antes.
    const target = users.find((u) => u.uid === uid);
    await updateDocById(COLLECTION, uid, { active });
    logActivity(
      active ? "user.unblock" : "user.block",
      `${active ? "Desbloqueó" : "Bloqueó"} al usuario ${target?.username ?? uid}`
    );
  }

  async function removeUser(user: UserProfile) {
    // Remove o perfil e o vínculo de login; a credencial em si no
    // Firebase Authentication continua existindo (requer Admin SDK /
    // Cloud Function pra remover, ver README).
    await deleteDocById(COLLECTION, user.uid);
    if (user.username) {
      await deleteDocById("usernames", user.username);
    }
    logActivity("user.delete", `Eliminó el acceso del usuario ${user.username}`);
  }

  return { users, loading, error, setActive, removeUser };
}
