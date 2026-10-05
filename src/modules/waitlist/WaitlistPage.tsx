import { useState } from "react";
import { useWaitlist } from "./useWaitlist";
import WaitlistForm from "./WaitlistForm";
import { PREFERRED_TIME_LABELS } from "../../types/waitlistEntry";
import { WEEKDAYS } from "../../types/professional";

const WEEKDAY_LABEL = Object.fromEntries(WEEKDAYS.map((w) => [w.key, w.label]));

export default function WaitlistPage() {
  const { entries, loading, error, addEntry, setStatus, removeEntry } = useWaitlist();
  const [showForm, setShowForm] = useState(false);

  const waiting = entries.filter((e) => e.status === "esperando");
  const others = entries.filter((e) => e.status !== "esperando");

  async function handleSave(input: Parameters<typeof addEntry>[0]) {
    await addEntry(input);
    setShowForm(false);
  }

  async function handleRemove(id: string, name: string) {
    if (confirm(`¿Eliminar a ${name} de la lista de espera?`)) {
      await removeEntry(id);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Lista de espera</h1>
        {!showForm && (
          <button className="btn" onClick={() => setShowForm(true)}>
            + Agregar a la lista
          </button>
        )}
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className={showForm ? "layout-split" : ""}>
        <div>
          {loading ? (
            <p>Cargando...</p>
          ) : entries.length === 0 ? (
            <div className="empty-state">Nadie en la lista de espera por el momento.</div>
          ) : (
            <>
              <table>
                <thead>
                  <tr>
                    <th>Paciente</th>
                    <th>Preferencia</th>
                    <th>Profesional</th>
                    <th>Días</th>
                    <th>Observación</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {waiting.map((e) => (
                    <tr key={e.id}>
                      <td>{e.patientName}</td>
                      <td>{PREFERRED_TIME_LABELS[e.preferredTime]}</td>
                      <td>{e.preferredProfessionalName ?? "— cualquiera —"}</td>
                      <td>
                        {e.preferredDays.length === 0
                          ? "cualquier día"
                          : e.preferredDays.map((d) => WEEKDAY_LABEL[d]).join(", ")}
                      </td>
                      <td>{e.observation ?? "—"}</td>
                      <td>
                        <div className="row-actions">
                          <button onClick={() => setStatus(e.id, "descartado")}>Descartar</button>
                          <button onClick={() => handleRemove(e.id, e.patientName)}>Eliminar</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {others.length > 0 && (
                <>
                  <h2 style={{ fontSize: 14, marginTop: 24, color: "var(--text-muted)" }}>
                    Convertidos / descartados
                  </h2>
                  <table>
                    <tbody>
                      {others.map((e) => (
                        <tr key={e.id} className="inactive">
                          <td>{e.patientName}</td>
                          <td>{e.status === "convertido" ? "Convertido en sesión" : "Descartado"}</td>
                          <td>
                            <div className="row-actions">
                              {e.status === "descartado" && (
                                <button onClick={() => setStatus(e.id, "esperando")}>Reactivar</button>
                              )}
                              <button onClick={() => handleRemove(e.id, e.patientName)}>Eliminar</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </>
          )}
        </div>

        {showForm && <WaitlistForm onSave={handleSave} onCancel={() => setShowForm(false)} />}
      </div>
    </div>
  );
}
