import { useState } from "react";
import type { SettlementAdjustment } from "../../types/settlement";

interface Props {
  professionalName: string;
  adjustments: SettlementAdjustment[];
  onSave: (adjustments: SettlementAdjustment[]) => Promise<void>;
  onClose: () => void;
}

export default function AdjustmentsModal({ professionalName, adjustments, onSave, onClose }: Props) {
  const [items, setItems] = useState<SettlementAdjustment[]>(adjustments);
  const [concept, setConcept] = useState("");
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addItem() {
    if (!concept.trim()) {
      setError("Indique el concepto del ajuste.");
      return;
    }
    setError(null);
    setItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), concept: concept.trim(), amount: Number(amount.replace(",", ".")) || 0 },
    ]);
    setConcept("");
    setAmount("");
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(items);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar.");
      setSaving(false);
    }
  }

  const total = items.reduce((sum, i) => sum + i.amount, 0);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="panel modal-panel" onClick={(e) => e.stopPropagation()}>
        <h2>Ajustes — {professionalName}</h2>
        {error && <div className="error-banner">{error}</div>}

        {items.length > 0 && (
          <ul style={{ listStyle: "none", padding: 0, margin: "0 0 14px" }}>
            {items.map((i) => (
              <li
                key={i.id}
                style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "4px 0" }}
              >
                <span>{i.concept}</span>
                <span>
                  {i.amount.toLocaleString("es-PY")} Gs{" "}
                  <button type="button" className="link-button" onClick={() => removeItem(i.id)}>
                    eliminar
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}

        <div className="field-row">
          <div className="field">
            <label htmlFor="concept">Concepto</label>
            <input
              id="concept"
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              placeholder="Almuerzo, deuda..."
            />
          </div>
          <div className="field">
            <label htmlFor="amount">Monto (Gs)</label>
            <input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
            />
          </div>
        </div>
        <button type="button" className="btn secondary" onClick={addItem} style={{ marginBottom: 16 }}>
          + Agregar ajuste
        </button>

        <p style={{ fontSize: 12.5, color: "var(--text-muted)" }}>
          Total de ajustes: {total.toLocaleString("es-PY")} Gs (se descuenta del monto a recibir)
        </p>

        <div className="form-actions">
          <button type="button" className="btn" onClick={handleSave} disabled={saving}>
            {saving ? "Guardando..." : "Guardar ajustes"}
          </button>
          <button type="button" className="btn secondary" onClick={onClose}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
