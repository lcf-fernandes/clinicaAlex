import { useState } from "react";
import { where } from "firebase/firestore";
import { fetchRaw } from "../../shared/firestore/crud";
import { downloadCsv, toCsv } from "../../shared/csv";
import { logActivity } from "../../shared/audit/logActivity";
import { todayISO } from "../../shared/date";
import { PAYMENT_LABELS, STATUS_LABELS, type PaymentMethod, type SessionStatus } from "../../types/session";
import type { SettlementAdjustment } from "../../types/settlement";

function fmtDate(iso: unknown) {
  return typeof iso === "string" ? iso.split("-").reverse().join("/") : "";
}

function num(value: unknown) {
  return typeof value === "number" ? Math.round(value) : 0;
}

export default function ExportPage() {
  const today = todayISO();
  const [from, setFrom] = useState(`${today.slice(0, 7)}-01`);
  const [to, setTo] = useState(today);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(key: string, task: () => Promise<{ filename: string; csv: string; count: number; label: string }>) {
    setBusy(key);
    setMessage(null);
    setError(null);
    try {
      const { filename, csv, count, label } = await task();
      if (count === 0) {
        setMessage("No hay datos para exportar con ese filtro.");
        return;
      }
      downloadCsv(filename, csv);
      logActivity("data.export", `Exportó ${label} a CSV (${count} fila(s))`);
      setMessage(`Descargado ${filename} (${count} fila(s)).`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al exportar.");
    } finally {
      setBusy(null);
    }
  }

  function exportPatients() {
    return run("patients", async () => {
      const docs = await fetchRaw("patients");
      const rows = docs
        .sort((a, b) => String(a.fullName).localeCompare(String(b.fullName)))
        .map((p) => {
          const billing = (p.billingProfiles as { name: string; ruc: string }[] | undefined) ?? [];
          return [
            p.fullName,
            p.phone,
            billing.map((b) => `${b.name} (${b.ruc})`).join(" | "),
            p.notes,
          ];
        });
      return {
        filename: `pacientes_${todayISO()}.csv`,
        csv: toCsv(["Nombre", "Teléfono", "Facturación (nombre y RUC)", "Observaciones"], rows),
        count: rows.length,
        label: "pacientes",
      };
    });
  }

  function exportSessions() {
    return run("sessions", async () => {
      const docs = await fetchRaw("sessions", [where("date", ">=", from), where("date", "<=", to)]);
      const rows = docs
        .sort((a, b) => `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`))
        .map((s) => {
          const payment = s.payment as { method: PaymentMethod; amount: number } | undefined;
          return [
            fmtDate(s.date),
            s.startTime,
            num(s.durationMinutes),
            s.professionalName,
            s.scheduledProfessionalName ?? "",
            s.patientName,
            STATUS_LABELS[s.status as SessionStatus] ?? s.status,
            payment ? PAYMENT_LABELS[payment.method] : "",
            payment ? num(payment.amount) : "",
            s.notes,
          ];
        });
      return {
        filename: `sesiones_${from}_a_${to}.csv`,
        csv: toCsv(
          ["Fecha", "Hora", "Duración (min)", "Profesional", "Profesional habitual (reemplazo)", "Paciente", "Estado", "Forma de pago", "Monto (Gs)", "Observaciones"],
          rows
        ),
        count: rows.length,
        label: `sesiones (${fmtDate(from)} a ${fmtDate(to)})`,
      };
    });
  }

  function exportSettlements() {
    return run("settlements", async () => {
      const docs = await fetchRaw("dailySettlements", [where("date", ">=", from), where("date", "<=", to)]);
      // Só fechadas têm valores confiáveis (ver DailySettlement).
      const closed = docs.filter((s) => s.closedAt != null);
      const rows = closed
        .sort((a, b) => `${a.date}${a.professionalName}`.localeCompare(`${b.date}${b.professionalName}`))
        .map((s) => [
          fmtDate(s.date),
          s.professionalName,
          num(s.sessionsCount),
          num(s.grossAmount),
          num(s.roomCost),
          num(s.feesTotal),
          ((s.adjustments as SettlementAdjustment[] | undefined) ?? []).reduce((sum, a) => sum + a.amount, 0),
          num(s.netAmount),
        ]);
      return {
        filename: `liquidaciones_${from}_a_${to}.csv`,
        csv: toCsv(["Fecha", "Profesional", "Sesiones", "Bruto (Gs)", "Sala (Gs)", "Tasas (Gs)", "Ajustes (Gs)", "A recibir (Gs)"], rows),
        count: rows.length,
        label: `liquidaciones cerradas (${fmtDate(from)} a ${fmtDate(to)})`,
      };
    });
  }

  return (
    <div>
      <div className="page-header">
        <h1>Exportar datos</h1>
      </div>

      <p style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: -10 }}>
        Descarga archivos CSV para abrir en Excel — sirve de respaldo y para análisis que la aplicación
        no hace. Cada exportación queda registrada en el historial de acciones.
      </p>

      {error && <div className="error-banner">{error}</div>}
      {message && (
        <div className="error-banner" style={{ background: "#e4f1e8", color: "var(--success)", borderColor: "#c5dfcc" }}>
          {message}
        </div>
      )}

      <div className="panel" style={{ maxWidth: 520, marginBottom: 16 }}>
        <h2>Pacientes</h2>
        <p style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: -8 }}>
          Lista completa: nombre, teléfono, datos de facturación y observaciones.
        </p>
        <button className="btn" disabled={busy !== null} onClick={exportPatients}>
          {busy === "patients" ? "Exportando..." : "Descargar CSV"}
        </button>
      </div>

      <div className="panel" style={{ maxWidth: 520 }}>
        <h2>Sesiones y liquidaciones</h2>
        <p style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: -8 }}>
          Elija el período. Las liquidaciones exportadas son solo las ya cerradas.
        </p>
        <div className="field-row">
          <div className="field">
            <label htmlFor="exportFrom">Desde</label>
            <input id="exportFrom" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="exportTo">Hasta</label>
            <input id="exportTo" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        </div>
        <div className="form-actions">
          <button className="btn" disabled={busy !== null || !from || !to || from > to} onClick={exportSessions}>
            {busy === "sessions" ? "Exportando..." : "Descargar sesiones"}
          </button>
          <button className="btn secondary" disabled={busy !== null || !from || !to || from > to} onClick={exportSettlements}>
            {busy === "settlements" ? "Exportando..." : "Descargar liquidaciones"}
          </button>
        </div>
      </div>
    </div>
  );
}
