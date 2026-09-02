export interface BillingProfile {
  id: string;
  name: string; // nome / razão social para facturación
  ruc: string;
  isDefault: boolean;
}

export interface Patient {
  id: string;
  fullName: string;
  phone: string;
  billingProfiles: BillingProfile[];
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export type PatientInput = Omit<Patient, "id" | "createdAt" | "updatedAt">;
