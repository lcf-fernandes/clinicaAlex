import { useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../firebase/config";
import { resolveEmailFromUsername } from "./usernameMap";
import { DEFAULT_PERMISSIONS, type UserProfile } from "../../types/user";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        setProfile(await loadProfile(u.uid));
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  async function loadProfile(uid: string): Promise<UserProfile | null> {
    const snap = await getDoc(doc(db, "users", uid));
    if (!snap.exists()) return null;
    const data = snap.data();
    const role = (data.role as UserProfile["role"]) ?? "secretary";
    return {
      uid,
      username: (data.username as string) ?? "",
      role,
      permissions: (data.permissions as UserProfile["permissions"]) ?? DEFAULT_PERMISSIONS[role],
      active: (data.active as boolean) ?? true,
    };
  }

  async function signIn(username: string, password: string) {
    const email = resolveEmailFromUsername(username.trim());
    if (!email) {
      throw new Error("Usuário ou senha inválidos.");
    }
    await signInWithEmailAndPassword(auth, email, password);
  }

  async function signOut() {
    await firebaseSignOut(auth);
  }

  return { user, profile, loading, signIn, signOut };
}
