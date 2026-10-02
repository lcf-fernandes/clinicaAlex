/**
 * O Firebase Auth exige e-mail/senha; como a secretária pensa em termos
 * de "usuário", mapeamos usuário → e-mail aqui (o mesmo e-mail cadastrado
 * na conta em Authentication → Users). Isso não é dado sensível em si
 * (só o vínculo usuário → e-mail, nunca a senha), então pode ficar
 * versionado — mas como são e-mails reais aqui, considere usar um
 * endereço sintético (ex.: usuario@clinicaalex.local) se preferir não
 * deixá-los visíveis no repositório.
 *
 * Pra adicionar um novo usuário: criar a conta no Firebase Console
 * (Authentication → Users) com o e-mail correspondente, mais o
 * documento em `users/{uid}` (ver src/types/user.ts), e adicionar a
 * entrada aqui.
 */
export const USERNAME_TO_EMAIL: Record<string, string> = {
  Overlord: "leandrowebmaster@gmail.com",
  Sec1: "atreidesthe@gmail.com",
};

export function resolveEmailFromUsername(username: string): string | null {
  return USERNAME_TO_EMAIL[username] ?? null;
}
