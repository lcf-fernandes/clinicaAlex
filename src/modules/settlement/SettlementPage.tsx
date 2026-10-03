import { useMemo, useState } from "react";
import { useProfessionals } from "../professionals/useProfessionals";
import { useSessions } from "../agenda/useSessions";
import { useSettlements } from "./useSettlements";
import AdjustmentsModal from "./AdjustmentsModal";
import { addDays, formatLongDate, todayISO } from "../../shared/date";
import { computeSettlement, type DailySettlement, type SettlementAdjustment } from "../../types/settlement";
import type { Professional } from "../../types/professional";

interface Row {
  professionalId: string;
  professionalName: string;
  professional: Professional | null;
  settlement: DailySettlement | null;
  adjustments: SettlementAdjustment[];
  closed: boolean;
  sessionsCount: number;
  grossAmount: number;
  roomCost: number;
  feesTotal: number;
  netAmount: number;
}

function formatGs(n: number) {
  return `${Math.round(n).toLocaleString("es-PY")} Gs`;
}

export default function SettlementPage() {
  const [date, setDate] = useState(todayISO());
  const { professionals } = useProfessionals();
  const { sessions, loading: loadingSessions } = useSessions(date);
  const { settlements, loading: loadingSettlements, saveAdjustments, closeSettlement, reopenSettlement } =
    useSettlements(date);

  const [adjustmentsFor, setAdjustmentsFor] = useState<Row | null>(null);

  const rows = useMemo<Row[]>(() => {
    const byProfessional = new Map<string, DailySettlement>();
    settlements.forEach((s) => byProfessional.set(s.professionalId, s));

    const attendedByProfessional = new Map<string, { durationMinutes: number }[]>();
    sessions
      .filter((s) => s.status === "asistio")
      .forEach((s) => {
        const list = attendedByProfessional.get(s.professionalId) ?? [];
        list.push({ durationMinutes: s.durationMinutes });
        attendedByProfessional.set(s.professionalId, list);
      });

    const ids = new Set<string>([...attendedByProfessional.keys(), ...byProfessional.keys()]);

    return Array.from(ids)
      .map((professionalId): Row => {
        const professional = professionals.find((p) => p.id === professionalId) ?? null;
        const settlement = byProfessional.get(professionalId) ?? null;
        const professionalName = professional?.name ?? settlement?.professionalName ?? "—";
        const closed = Boolean(settlement?.closedAt);
        const adjustments = settlement?.adjustments ?? [];

        if (closed && settlement) {
          return {
            professionalId,
            professionalName,
            professional,
            settlement,
            adjustments,
            closed: true,
            sessionsCount: settlement.sessionsCount,
            grossAmount: settlement.grossAmount,
            roomCost: settlement.roomCost,
            feesTotal: settlement.feesTotal,
            netAmount: settlement.netAmount,
          };
        }

        const attended = attendedByProfessional.get(professionalId) ?? [];
        const calc = professional
          ? computeSettlement(professional, attended, adjustments)
          : { sessionsCount: 0, grossAmount: 0, roomCost: 0, feesTotal: 0, adjustmentsTotal: 0, netAmount: 0 };

        return {
          professionalId,
          professionalName,
          professional,
          settlement,
          adjustments,
          closed: false,
          sessionsCount: calc.sessionsCount,
          grossAmount: calc.grossAmount,
          roomCost: calc.roomCost,
          feesTotal: calc.feesTotal,
          netAmount: calc.netAmount,
        };
      })
      .sort((a, b) => a.professionalName.localeCompare(b.professionalName));
  }, [sessions, settlements, professionals]);

  const loading = loadingSessions || loadingSettlements;
  const openRows = rows.filter((r) => !r.closed);
  const totalNet = rows.reduce((sum, r) => sum + r.netAmount, 0);

  async function handleSaveAdjustments(row: Row, adjustments: SettlementAdjustment[]) {
    await saveAdjustments(row.professionalId, row.professionalName, adjustments);
  }

  async function handleCloseRow(row: Row) {
    if (!row.professional) return;
    if (!confirm(`Fechar a liquidação de ${row.professionalName}? Os valores ficam travados a partir daqui.`))
      return;
    await closeSettlement(row.professionalId, row.professionalName, row.adjustments, {
      sessionsCount: row.sessionsCount,
      grossAmount: row.grossAmount,
      roomCost: row.roomCost,
      feesTotal: row.feesTotal,
      adjustmentsTotal: row.adjustments.reduce((s, a) => s + a.amount, 0),
      netAmount: row.netAmount,
    });
  }

  async function handleReopenRow(row: Row) {
    await reopenSettlement(row.professionalId, row.professionalName, row.adjustments);
  }

  async function handleCloseAll() {
    if (openRows.length === 0) return;
    if (!confirm(`Fechar a liquidação do dia inteiro (${openRows.length} profissional(is))? Os valores ficam travados.`))
      return;
    for (const row of openRows) {
      if (!row.professional) continue;
      await closeSettlement(row.professionalId, row.professionalName, row.adjustments, {
        sessionsCount: row.sessionsCount,
        grossAmount: row.grossAmount,
        roomCost: row.roomCost,
        feesTotal: row.feesTotal,
        adjustmentsTotal: row.adjustments.reduce((s, a) => s + a.amount, 0),
        netAmount: row.netAmount,
      });
    }
  }

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
        {openRows.length > 0 && (
          <button className="btn" onClick={handleCloseAll}>
            Fechar liquidação do dia
          </button>
        )}
      </div>

      <h1 className="agenda-date-title">Liquidação — {formatLongDate(date)}</h1>

      {loading ? (
        <p>Carregando...</p>
      ) : rows.length === 0 ? (
        <div className="empty-state">Nenhuma sessão realizada (Asistió) registrada nesse dia ainda.</div>
      ) : (
        <>
          <table>
            <thead>
              <tr>
                <th>Profissional</th>
                <th>Sessões</th>
                <th>Bruto</th>
                <th>Sala</th>
                <th>Taxas</th>
                <th>Ajustes</th>
                <th>A receber</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.professionalId} className={row.closed ? "inactive" : ""}>
                  <td>{row.professionalName}</td>
                  <td>{row.sessionsCount}</td>
                  <td>{formatGs(row.grossAmount)}</td>
                  <td>{formatGs(row.roomCost)}</td>
                  <td>{formatGs(row.feesTotal)}</td>
                  <td>{formatGs(row.adjustments.reduce((s, a) => s + a.amount, 0))}</td>
                  <td>
                    <strong>{formatGs(row.netAmount)}</strong>
                  </td>
                  <td>{row.closed ? "Fechada" : "Aberta"}</td>
                  <td>
                    <div className="row-actions">
                      {!row.closed && (
                        <>
                          <button onClick={() => setAdjustmentsFor(row)}>Ajustes</button>
                          <button onClick={() => handleCloseRow(row)}>Fechar</button>
                        </>
                      )}
                      {row.closed && <button onClick={() => handleReopenRow(row)}>Reabrir</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 12 }}>
            Total líquido do dia (todos os profissionais): <strong>{formatGs(totalNet)}</strong>
          </p>
        </>
      )}

      {adjustmentsFor && (
        <AdjustmentsModal
          professionalName={adjustmentsFor.professionalName}
          adjustments={adjustmentsFor.adjustments}
          onSave={(adjustments) => handleSaveAdjustments(adjustmentsFor, adjustments)}
          onClose={() => setAdjustmentsFor(null)}
        />
      )}
    </div>
  );
}
