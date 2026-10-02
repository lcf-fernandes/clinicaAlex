import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase/config";

/**
 * O Firebase Auth exige e-mail/senha; como a secretária pensa em termos
 * de "usuário", resolvemos usuário → e-mail buscando na coleção
 * `usernames/{username}` do Firestore (leitura pública, só com
 * {email, uid} — ver firestore.rules). Assim, criar um usuário novo
 * não exige alterar o código: só criar a conta no Authentication, o
 * documento em `users/{uid}` (papel/permissões) e o documento em
 * `usernames/{username}` (ver README).
 */
export async function resolveEmailFromUsername(username: string): Promise<string | null> {
  const snap = await getDoc(doc(db, "usernames", username));
  if (!snap.exists()) return null;
  return (snap.data().email as string) ?? null;
}
