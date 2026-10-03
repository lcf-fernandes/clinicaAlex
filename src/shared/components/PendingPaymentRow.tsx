import { useState } from "react";
import type { PaymentMethod } from "../../types/session";

interface Props {
  sessionId: string;
  defaultAmount: number;
  onConfirm: (sessionId: string, method: PaymentMethod, amount: number) => Promise<void>;
}

export default function PendingPaymentRow({ sessionId, defaultAmount, onConfirm }: Props) {
  const [method, setMethod] = useState<PaymentMethod>("efectivo");
  const [amount, setAmount] = useState(defaultAmount);
  const [saving, setSaving] = useState(false);

  async function confirm() {
    setSaving(true);
    try {
      await onConfirm(sessionId, method, amount);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="pending-payment-row">
      <select value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>
        <option value="efectivo">Efectivo</option>
        <option value="transferencia">Transferencia</option>
        <option value="cheque">Cheque</option>
      </select>
      <input
        type="number"
        min={0}
        value={amount}
        onChange={(e) => setAmount(Number(e.target.value))}
        style={{ width: 90 }}
      />
      <button type="button" onClick={confirm} disabled={saving}>
        {saving ? "..." : "Marcar pago"}
      </button>
    </div>
  );
}
