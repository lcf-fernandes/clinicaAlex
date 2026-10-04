import { deleteApp, initializeApp } from "firebase/app";
import { createUserWithEmailAndPassword, getAuth, signOut } from "firebase/auth";
import { firebaseConfig } from "../../firebase/config";

/**
 * O Firebase Auth troca a sessão ativa do navegador pra quem acabou de
 * ser criado assim que createUserWithEmailAndPassword roda — então
 * criar outra pessoa direto na instância principal do app derrubaria
 * o login de quem está usando o painel de Usuários agora.
 *
 * O jeito padrão de evitar isso sem precisar de Cloud Function/Admin
 * SDK: abrir uma segunda instância do Firebase App (mesma config,
 * nome diferente), criar a conta nela, sair dela e descartá-la —
 * a sessão principal (admin/secretaria logado) nunca é tocada.
 */
export async function createAuthAccount(email: string, password: string): Promise<string> {
  const secondaryApp = initializeApp(firebaseConfig, `secondary-${Date.now()}`);
  try {
    const secondaryAuth = getAuth(secondaryApp);
    const credential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    const uid = credential.user.uid;
    await signOut(secondaryAuth);
    return uid;
  } finally {
    await deleteApp(secondaryApp);
  }
}
