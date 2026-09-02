export type UserRole = "admin" | "secretary";

/**
 * Espaço para restringir o acesso a informações específicas mais pra
 * frente (ex.: valores de liquidação, dados de facturación). Por
 * enquanto todas as chaves default para `true` pros dois papéis — o
 * campo existe pra já termos onde configurar isso sem migrar dados
 * depois.
 */
export interface UserPermissions {
  viewSettlements: boolean; // ver liquidação diária dos profissionais
  editSettlements: boolean; // fechar/editar liquidação
  viewBilling: boolean; // ver dados de facturación/RUC dos pacientes
  manageUsers: boolean; // criar/editar outros usuários
}

export interface UserProfile {
  uid: string;
  username: string;
  role: UserRole;
  permissions: UserPermissions;
  active: boolean;
}

export const DEFAULT_PERMISSIONS: Record<UserRole, UserPermissions> = {
  admin: {
    viewSettlements: true,
    editSettlements: true,
    viewBilling: true,
    manageUsers: true,
  },
  secretary: {
    viewSettlements: true,
    editSettlements: true,
    viewBilling: true,
    manageUsers: false,
  },
};
