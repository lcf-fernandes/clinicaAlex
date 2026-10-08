import { useState } from "react";
import { useMySettlement } from "./useMySettlement";
import { addDays, formatLongDate, todayISO } from "../../shared/date";

interface Props {
  professionalId: string;
}

function formatGs(n: number) {
  return `${Math.round(n).toLocaleString("es-PY")} Gs`;
}

export default function MySettlementPage({ professionalId }: Props) {
  const [date, setDate] = useState(todayISO());
  const { settlement, loading, error } = useMySettlement(professionalId, date);

  return (
    <div>
      <div className="page-header">
        <div className="agenda-date-nav">
          <button className="btn secondary" onClick={() => setDate((d) => addDays(d, -1))}>
            ← Anterior
          </button>
          <button className="btn secondary" onClick={() => setDate(todayISO())}>
            Hoy
          </button>
          <button className="btn secondary" onClick={() => setDate((d) => addDays(d, 1))}>
            Siguiente →
          </button>
        </div>
      </div>

      <h1 className="agenda-date-title">Liquidación — {formatLongDate(date)}</h1>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <p>Cargando...</p>
      ) : !settlement ? (
        <div className="empty-state">
          Liquidación todavía no disponible para este día — hable con la secretaria.
        </div>
      ) : !settlement.closedAt ? (
        <div className="empty-state">
          La liquidación de este día todavía está abierta. Los valores definitivos aparecen cuando la
          secretaria la cierra.
        </div>
      ) : (
        <div className="panel" style={{ maxWidth: 420 }}>
          <p style={{ marginTop: 0, fontSize: 12.5, color: "var(--text-muted)" }}>Cerrada</p>
          <table>
            <tbody>
              <tr>
                <td>Sesiones</td>
                <td>{settlement.sessionsCount}</td>
              </tr>
              <tr>
                <td>Bruto</td>
                <td>{formatGs(settlement.grossAmount)}</td>
              </tr>
              <tr>
                <td>Sala</td>
                <td>− {formatGs(settlement.roomCost)}</td>
              </tr>
              <tr>
                <td>Tasas</td>
                <td>− {formatGs(settlement.feesTotal)}</td>
              </tr>
              {settlement.adjustments.map((a) => (
                <tr key={a.id}>
                  <td>{a.concept}</td>
                  <td>− {formatGs(a.amount)}</td>
                </tr>
              ))}
              <tr>
                <td>
                  <strong>A recibir</strong>
                </td>
                <td>
                  <strong>{formatGs(settlement.netAmount)}</strong>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
