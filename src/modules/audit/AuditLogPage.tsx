import { useMemo, useState } from "react";
import { useAuditLog } from "./useAuditLog";

const ACTION_GROUPS: { value: string; label: string; prefix: string }[] = [
  { value: "all", label: "Todas las acciones", prefix: "" },
  { value: "session", label: "Sesiones", prefix: "session." },
  { value: "payment", label: "Pagos", prefix: "payment." },
  { value: "settlement", label: "Liquidaciones", prefix: "settlement." },
  { value: "user", label: "Usuarios", prefix: "user." },
];

function formatDateTime(ms: number) {
  if (!ms) return "—";
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AuditLogPage() {
  const { entries, loading, error } = useAuditLog();
  const [group, setGroup] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const prefix = ACTION_GROUPS.find((g) => g.value === group)?.prefix ?? "";
    const term = search.trim().toLowerCase();
    return entries.filter(
      (e) =>
        e.action.startsWith(prefix) &&
        (!term || e.summary.toLowerCase().includes(term) || e.username.toLowerCase().includes(term))
    );
  }, [entries, group, search]);

  return (
    <div>
      <div className="page-header">
        <h1>Historial de acciones</h1>
      </div>

      <p style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: -10 }}>
        Últimas 300 acciones registradas. Es un registro de buena fe hecho desde la propia aplicación:
        sirve para aclarar dudas del día a día, no como prueba infalible.
      </p>

      {error && <div className="error-banner">{error}</div>}

      <div className="field-row" style={{ marginBottom: 12 }}>
        <div className="field" style={{ marginBottom: 0 }}>
          <select value={group} onChange={(e) => setGroup(e.target.value)}>
            {ACTION_GROUPS.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field" style={{ marginBottom: 0 }}>
          <input
            placeholder="Buscar por usuario o texto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <p>Cargando...</p>
      ) : filtered.length === 0 ? (
        <div className="empty-state">No hay acciones registradas con ese filtro.</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Fecha y hora</th>
              <th>Usuario</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((e) => (
              <tr key={e.id}>
                <td style={{ whiteSpace: "nowrap" }}>{formatDateTime(e.createdAt)}</td>
                <td>{e.username}</td>
                <td>{e.summary}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
