import { useMemo, useState } from "react";
import { useMonthlySettlements } from "./useMonthlySettlements";
import { todayISO } from "../../shared/date";

function formatGs(n: number) {
  return `${Math.round(n).toLocaleString("es-PY")} Gs`;
}

const MONTH_NAMES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

function formatYearMonth(yearMonth: string) {
  const [y, m] = yearMonth.split("-").map(Number);
  return `${MONTH_NAMES[m - 1]} de ${y}`;
}

interface Row {
  professionalId: string;
  professionalName: string;
  diasFechados: number;
  sessionsCount: number;
  grossAmount: number;
  roomCost: number;
  feesTotal: number;
  adjustmentsTotal: number;
  netAmount: number;
}

export default function MonthlyReportPage() {
  const [yearMonth, setYearMonth] = useState(todayISO().slice(0, 7));
  const { settlements, openDates, loading, error } = useMonthlySettlements(yearMonth);

  const rows = useMemo<Row[]>(() => {
    const byProfessional = new Map<string, Row>();
    for (const s of settlements) {
      const adjustmentsTotal = s.adjustments.reduce((sum, a) => sum + a.amount, 0);
      const existing = byProfessional.get(s.professionalId);
      if (existing) {
        existing.diasFechados += 1;
        existing.sessionsCount += s.sessionsCount;
        existing.grossAmount += s.grossAmount;
        existing.roomCost += s.roomCost;
        existing.feesTotal += s.feesTotal;
        existing.adjustmentsTotal += adjustmentsTotal;
        existing.netAmount += s.netAmount;
      } else {
        byProfessional.set(s.professionalId, {
          professionalId: s.professionalId,
          professionalName: s.professionalName,
          diasFechados: 1,
          sessionsCount: s.sessionsCount,
          grossAmount: s.grossAmount,
          roomCost: s.roomCost,
          feesTotal: s.feesTotal,
          adjustmentsTotal,
          netAmount: s.netAmount,
        });
      }
    }
    return Array.from(byProfessional.values()).sort((a, b) =>
      a.professionalName.localeCompare(b.professionalName)
    );
  }, [settlements]);

  const totalNet = rows.reduce((sum, r) => sum + r.netAmount, 0);
  const totalGross = rows.reduce((sum, r) => sum + r.grossAmount, 0);

  return (
    <div>
      <div className="page-header">
        <h1>Reporte mensual</h1>
        <div className="field" style={{ marginBottom: 0 }}>
          <input
            type="month"
            value={yearMonth}
            onChange={(e) => setYearMonth(e.target.value)}
          />
        </div>
      </div>

      <h2 style={{ fontSize: 15, color: "var(--text-muted)", marginTop: -8, textTransform: "capitalize" }}>
        {formatYearMonth(yearMonth)}
      </h2>

      {error && <div className="error-banner">{error}</div>}

      {openDates.length > 0 && (
        <div className="error-banner" style={{ background: "#fbf3e3", color: "#8a6a2f" }}>
          {openDates.length} día(s) de este mes todavía tienen liquidación abierta (sin cerrar) y no
          entran en esta suma: {openDates.sort().map((d) => d.split("-").reverse().join("/")).join(", ")}
        </div>
      )}

      {loading ? (
        <p>Cargando...</p>
      ) : rows.length === 0 ? (
        <div className="empty-state">Ninguna liquidación cerrada en este mes todavía.</div>
      ) : (
        <>
          <table>
            <thead>
              <tr>
                <th>Profesional</th>
                <th>Días cerrados</th>
                <th>Sesiones</th>
                <th>Bruto</th>
                <th>Sala</th>
                <th>Tasas</th>
                <th>Ajustes</th>
                <th>A recibir</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.professionalId}>
                  <td>{r.professionalName}</td>
                  <td>{r.diasFechados}</td>
                  <td>{r.sessionsCount}</td>
                  <td>{formatGs(r.grossAmount)}</td>
                  <td>{formatGs(r.roomCost)}</td>
                  <td>{formatGs(r.feesTotal)}</td>
                  <td>{formatGs(r.adjustmentsTotal)}</td>
                  <td>
                    <strong>{formatGs(r.netAmount)}</strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 12 }}>
            Total bruto del mes: <strong>{formatGs(totalGross)}</strong> · Total líquido (todos los
            profesionales): <strong>{formatGs(totalNet)}</strong>
          </p>
        </>
      )}
    </div>
  );
}
