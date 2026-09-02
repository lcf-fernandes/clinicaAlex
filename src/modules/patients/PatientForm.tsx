import { useState } from "react";
import type { BillingProfile, Patient, PatientInput } from "../../types/patient";

interface Props {
  initial?: Patient;
  onSave: (input: PatientInput) => Promise<void>;
  onCancel: () => void;
}

function newBillingProfile(): BillingProfile {
  return { id: crypto.randomUUID(), name: "", ruc: "", isDefault: false };
}

export default function PatientForm({ initial, onSave, onCancel }: Props) {
  const [fullName, setFullName] = useState(initial?.fullName ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [billingProfiles, setBillingProfiles] = useState<BillingProfile[]>(
    initial?.billingProfiles ?? []
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addBillingProfile() {
    setBillingProfiles((prev) => [
      ...prev,
      { ...newBillingProfile(), isDefault: prev.length === 0 },
    ]);
  }

  function updateBillingProfile(id: string, field: keyof BillingProfile, value: string | boolean) {
    setBillingProfiles((prev) =>
      prev.map((bp) => (bp.id === id ? { ...bp, [field]: value } : bp))
    );
  }

  function setDefaultBillingProfile(id: string) {
    setBillingProfiles((prev) => prev.map((bp) => ({ ...bp, isDefault: bp.id === id })));
  }

  function removeBillingProfile(id: string) {
    setBillingProfiles((prev) => prev.filter((bp) => bp.id !== id));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim()) {
      setError("Informe o nome do paciente.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave({
        fullName: fullName.trim(),
        phone: phone.trim(),
        notes: notes.trim(),
        billingProfiles,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="panel" onSubmit={handleSubmit}>
      <h2>{initial ? "Editar paciente" : "Novo paciente"}</h2>
      {error && <div className="error-banner">{error}</div>}

      <div className="field">
        <label htmlFor="fullName">Nome completo</label>
        <input
          id="fullName"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Ex.: Juan Medina"
        />
      </div>

      <div className="field">
        <label htmlFor="phone">Telefone</label>
        <input
          id="phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="0981 123 456"
        />
      </div>

      <div className="field">
        <label>Perfis de facturación</label>
        {billingProfiles.length === 0 && (
          <div className="empty-state" style={{ padding: 14, marginBottom: 8 }}>
            Nenhum cadastrado. O paciente pode ter mais de um caso precise faturar em nomes diferentes.
          </div>
        )}
        {billingProfiles.map((bp) => (
          <div className="billing-profile" key={bp.id}>
            <div className="field-row">
              <div className="field">
                <label>Nome / razão social</label>
                <input
                  value={bp.name}
                  onChange={(e) => updateBillingProfile(bp.id, "name", e.target.value)}
                />
              </div>
              <div className="field">
                <label>RUC</label>
                <input
                  value={bp.ruc}
                  onChange={(e) => updateBillingProfile(bp.id, "ruc", e.target.value)}
                />
              </div>
            </div>
            <div className="row-actions" style={{ justifyContent: "space-between" }}>
              <label style={{ fontSize: 13 }}>
                <input
                  type="radio"
                  name="defaultBilling"
                  checked={bp.isDefault}
                  onChange={() => setDefaultBillingProfile(bp.id)}
                  style={{ width: "auto", marginRight: 6 }}
                />
                Padrão
              </label>
              <button type="button" onClick={() => removeBillingProfile(bp.id)}>
                Remover
              </button>
            </div>
          </div>
        ))}
        <button type="button" className="btn secondary" onClick={addBillingProfile}>
          + Adicionar perfil de facturación
        </button>
      </div>

      <div className="field">
        <label htmlFor="notes">Observações</label>
        <textarea
          id="notes"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <div className="form-actions">
        <button type="submit" className="btn" disabled={saving}>
          {saving ? "Salvando..." : "Salvar"}
        </button>
        <button type="button" className="btn secondary" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
