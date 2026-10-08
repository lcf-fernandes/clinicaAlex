/**
 * Quem está logado agora, num lugar que qualquer hook consegue ler sem
 * precisar chamar useAuth() de novo (useAuth preenche isso a cada
 * mudança de login).
 */
interface Actor {
  uid: string;
  username: string;
}

let current: Actor | null = null;

export function setCurrentActor(actor: Actor | null) {
  current = actor;
}

export function getCurrentActor(): Actor | null {
  return current;
}
