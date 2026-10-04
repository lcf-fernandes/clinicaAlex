import { useState } from "react";
import { useMySessions } from "./useMySessions";
import { addDays, formatLongDate, todayISO } from "../../shared/date";
import { PAYMENT_LABELS, STATUS_LABELS } from "../../types/session";

interface Props {
  professionalId: string;
}

export default function MyAgendaPage({ professionalId }: Props) {
  const [date, setDate] = useState(todayISO());
  const { sessions, loading, error } = useMySessions(professionalId, date);

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

      <h1 className="agenda-date-title">{formatLongDate(date)}</h1>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <p>Carregando...</p>
      ) : sessions.length === 0 ? (
        <div className="empty-state">Nenhuma sessão agendada para este dia.</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Horário</th>
              <th>Paciente</th>
              <th>Status</th>
              <th>Pagamento</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((s) => (
              <tr key={s.id}>
                <td>{s.startTime}</td>
                <td>{s.patientName}</td>
                <td>{STATUS_LABELS[s.status]}</td>
                <td>{s.payment ? PAYMENT_LABELS[s.payment.method] : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
