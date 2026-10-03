import { usePendingPayments } from "./usePendingPayments";
import PendingPaymentRow from "../../shared/components/PendingPaymentRow";
import type { PaymentMethod } from "../../types/session";

export default function PaymentsPage() {
  const { sessions, loading, error, markPaid } = usePendingPayments();

  async function handleMarkPaid(sessionId: string, method: PaymentMethod, amount: number) {
    await markPaid(sessionId, { method, amount });
  }

  const totalPendente = sessions.reduce((sum, s) => sum + (s.payment?.amount ?? 0), 0);

  return (
    <div>
      <div className="page-header">
        <h1>Pagamentos pendentes</h1>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {!loading && sessions.length > 0 && (
        <p style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: -10, marginBottom: 16 }}>
          {sessions.length} pendência(s) · total em aberto: {totalPendente.toLocaleString("es-PY")} Gs
        </p>
      )}

      {loading ? (
        <p>Carregando...</p>
      ) : sessions.length === 0 ? (
        <div className="empty-state">Nenhum pagamento pendente no momento.</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Paciente</th>
              <th>Profissional</th>
              <th>Marcar como pago</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((s) => (
              <tr key={s.id}>
                <td>
                  {s.date.split("-").reverse().join("/")} {s.startTime}
                </td>
                <td>{s.patientName}</td>
                <td>{s.professionalName || "—"}</td>
                <td>
                  <PendingPaymentRow
                    sessionId={s.id}
                    defaultAmount={s.payment?.amount ?? 0}
                    onConfirm={handleMarkPaid}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
