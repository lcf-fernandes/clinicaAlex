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
            Hoje
          </button>
          <button className="btn secondary" onClick={() => setDate((d) => addDays(d, 1))}>
            Próximo →
          </button>
        </div>
      </div>

      <h1 className="agenda-date-title">Liquidação — {formatLongDate(date)}</h1>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <p>Carregando...</p>
      ) : !settlement ? (
        <div className="empty-state">
          Liquidação ainda não disponível para este dia — fala com a secretaria.
        </div>
      ) : (
        <div className="panel" style={{ maxWidth: 420 }}>
          <p style={{ marginTop: 0, fontSize: 12.5, color: "var(--text-muted)" }}>
            {settlement.closedAt ? "Fechada" : "Ainda em aberto — valores podem mudar"}
          </p>
          <table>
            <tbody>
              <tr>
                <td>Sessões</td>
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
                <td>Taxas</td>
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
                  <strong>A receber</strong>
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
