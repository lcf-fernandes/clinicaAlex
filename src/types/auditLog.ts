export interface AuditLogEntry {
  id: string;
  userId: string;
  username: string;
  /** Código curto da ação, ex.: "session.create", "settlement.close", "user.block". */
  action: string;
  /** Frase legível pro admin, já em espanhol — ex.: "Creó sesión de Juan con Alicia (08:00, 25/08/2026)". */
  summary: string;
  createdAt: number;
}
