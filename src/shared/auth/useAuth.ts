import { useEffect, useState } from "react";
import {
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../firebase/config";
import { resolveEmailFromUsername } from "./usernameMap";
import { setCurrentActor } from "../audit/currentActor";
import { DEFAULT_PERMISSIONS, type UserProfile } from "../../types/user";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const loaded = await loadProfile(u.uid);
        setProfile(loaded);
        setCurrentActor({ uid: u.uid, username: loaded?.username || u.email || u.uid });
      } else {
        setProfile(null);
        setCurrentActor(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  async function loadProfile(uid: string): Promise<UserProfile | null> {
    const snap = await getDoc(doc(db, "users", uid));
    if (!snap.exists()) return null;
    const data = snap.data();
    // Tolera variações de quem cadastrou o documento manualmente no
    // Console: "name" além de "username", e "secretaria"/"secretário"
    // além de "secretary".
    const username = (data.username as string) ?? (data.name as string) ?? "";
    const rawRole = String(data.role ?? "secretary").toLowerCase();
    const role: UserProfile["role"] = rawRole.startsWith("admin")
      ? "admin"
      : rawRole.startsWith("prof")
      ? "professional"
      : "secretary";
    return {
      uid,
      username,
      role,
      permissions: (data.permissions as UserProfile["permissions"]) ?? DEFAULT_PERMISSIONS[role],
      active: (data.active as boolean) ?? true,
      professionalId: data.professionalId as string | undefined,
      professionalName: data.professionalName as string | undefined,
    };
  }

  async function signIn(username: string, password: string) {
    const email = await resolveEmailFromUsername(username.trim());
    if (!email) {
      throw new Error("Usuario o contraseña inválidos.");
    }

    // 1. Autentica no Firebase
    const credential = await signInWithEmailAndPassword(auth, email, password);

    // 2/3. Busca o cadastro correspondente no Firestore (users/{uid})
    const loadedProfile = await loadProfile(credential.user.uid);

    // 4. Sem cadastro ou usuário desativado: desfaz o login e avisa
    if (!loadedProfile) {
      await firebaseSignOut(auth);
      throw new Error("El usuario no tiene una cuenta registrada en el sistema.");
    }
    if (!loadedProfile.active) {
      await firebaseSignOut(auth);
      throw new Error("Usuario deshabilitado.");
    }
    // onAuthStateChanged (acima) vai disparar em seguida e preencher
    // `user`/`profile` normalmente, então não precisamos repetir aqui.
  }

  async function signOut() {
    await firebaseSignOut(auth);
  }

  /**
   * Mesma resolução usuário→e-mail do login, mas pra disparar o
   * e-mail de redefinição de senha do próprio Firebase Auth — não
   * depende de admin nem de mexer no Console. Por segurança, não
   * revela se o usuário existe ou não (sempre "sucesso" do ponto de
   * vista da pessoa que pediu).
   */
  async function resetPasswordByUsername(username: string) {
    const email = await resolveEmailFromUsername(username.trim());
    if (!email) return;
    try {
      await sendPasswordResetEmail(auth, email);
    } catch {
      // auth/user-not-found etc. — não propaga, mesmo comportamento
      // de "sucesso silencioso" de quando o usuário não existe.
    }
  }

  return { user, profile, loading, signIn, signOut, resetPasswordByUsername };
}
