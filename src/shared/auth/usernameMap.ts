/**
 * O Firebase Auth exige e-mail/senha; como a secretária pensa em termos
 * de "usuário", mapeamos usuário → e-mail sintético aqui. Isso não é
 * dado sensível (só o vínculo usuário → e-mail interno, nunca a
 * senha), então pode ficar versionado.
 *
 * Pra adicionar um novo usuário: criar a conta no Firebase Console
 * (Authentication → Users) com o e-mail sintético correspondente, mais
 * o documento em `users/{uid}` (ver src/types/user.ts), e adicionar a
 * entrada aqui.
 */
export const USERNAME_TO_EMAIL: Record<string, string> = {
  Overlord: "overlord@clinicaalex.local",
  Sec1: "sec1@clinicaalex.local",
};

export function resolveEmailFromUsername(username: string): string | null {
  return USERNAME_TO_EMAIL[username] ?? null;
}
