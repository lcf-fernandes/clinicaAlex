import { createDoc } from "../firestore/crud";
import { getCurrentActor } from "./currentActor";

/**
 * Registra uma ação na trilha de auditoria (coleção auditLog). Nunca
 * deixa o erro de log quebrar a ação principal — se falhar, só avisa
 * no console. Sem Cloud Function no meio, isso é um registro "de boa
 * fé" feito pelo próprio navegador: protege contra esquecimento e
 * dúvida, não contra alguém tecnicamente mal-intencionado.
 */
export async function logActivity(action: string, summary: string) {
  const actor = getCurrentActor();
  if (!actor) return;
  try {
    await createDoc("auditLog", {
      userId: actor.uid,
      username: actor.username,
      action,
      summary,
    });
  } catch (err) {
    console.warn("Falha ao registrar auditoria:", err);
  }
}
