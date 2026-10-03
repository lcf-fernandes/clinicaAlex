import { usePatientHistory } from "./usePatientHistory";
import PendingPaymentRow from "../../shared/components/PendingPaymentRow";
import { PAYMENT_LABELS, STATUS_LABELS, type PaymentMethod } from "../../types/session";

interface Props {
  patientId: string;
  patientName: string;
  onClose: () => void;
}

export default function PatientHistoryPanel({ patientId, patientName, onClose }: Props) {
  const { sessions, loading, error, markPaid } = usePatientHistory(patientId);

  const totals = sessions.reduce(
    (acc, s) => {
      if (s.status === "asistio") acc.realizadas += 1;
      if (s.payment?.method === "pendiente") acc.pendentes += 1;
      return acc;
    },
    { realizadas: 0, pendentes: 0 }
  );

  async function handleMarkPaid(sessionId: string, method: PaymentMethod, amount: number) {
    await markPaid(sessionId, { method, amount });
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="panel modal-panel history-panel" onClick={(e) => e.stopPropagation()}>
        <h2>Histórico — {patientName}</h2>

        {!loading && sessions.length > 0 && (
          <p style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: -8, marginBottom: 14 }}>
            {sessions.length} sessões no total · {totals.realizadas} realizadas
            {totals.pendentes > 0 && ` · ${totals.pendentes} pagamento(s) pendente(s)`}
          </p>
        )}

        {error && <div className="error-banner">{error}</div>}

        {loading ? (
          <p>Carregando...</p>
        ) : sessions.length === 0 ? (
          <div className="empty-state">Nenhuma sessão registrada ainda para este paciente.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Profissional</th>
                <th>Status</th>
                <th>Pagamento</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.id}>
                  <td>
                    {s.date.split("-").reverse().join("/")} {s.startTime}
                  </td>
                  <td>{s.professionalName || "—"}</td>
                  <td>{STATUS_LABELS[s.status]}</td>
                  <td>
                    {s.payment && s.payment.method !== "pendiente" ? (
                      `${PAYMENT_LABELS[s.payment.method]} — ${s.payment.amount.toLocaleString("es-PY")} Gs`
                    ) : s.payment?.method === "pendiente" ? (
                      <PendingPaymentRow
                        sessionId={s.id}
                        defaultAmount={s.payment.amount}
                        onConfirm={handleMarkPaid}
                      />
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className="form-actions">
          <button type="button" className="btn secondary" onClick={onClose}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
