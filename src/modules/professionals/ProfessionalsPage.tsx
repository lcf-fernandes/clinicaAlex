import { useState } from "react";
import { useProfessionals } from "./useProfessionals";
import ProfessionalForm from "./ProfessionalForm";
import type { Professional, ProfessionalInput } from "../../types/professional";

export default function ProfessionalsPage() {
  const {
    professionals,
    loading,
    error,
    addProfessional,
    updateProfessional,
    removeProfessional,
  } = useProfessionals();
  const [editing, setEditing] = useState<Professional | null>(null);
  const [showForm, setShowForm] = useState(false);

  async function handleSave(input: ProfessionalInput) {
    if (editing) {
      await updateProfessional(editing.id, input);
    } else {
      await addProfessional(input);
    }
    setShowForm(false);
    setEditing(null);
  }

  function startEdit(p: Professional) {
    setEditing(p);
    setShowForm(true);
  }

  function startNew() {
    setEditing(null);
    setShowForm(true);
  }

  async function handleRemove(p: Professional) {
    if (confirm(`¿Eliminar a ${p.name}? Las sesiones ya registradas no se ven afectadas.`)) {
      await removeProfessional(p.id);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Profesionales</h1>
        {!showForm && (
          <button className="btn" onClick={startNew}>
            + Nuevo profesional
          </button>
        )}
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className={showForm ? "layout-split" : ""}>
        <div>
          {loading ? (
            <p>Cargando...</p>
          ) : professionals.length === 0 ? (
            <div className="empty-state">Todavía no hay profesionales registrados.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Valor/sesión</th>
                  <th>Sala/día</th>
                  <th>Tasa</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {professionals.map((p) => (
                  <tr key={p.id} className={p.active ? "" : "inactive"}>
                    <td>{p.name}{!p.active && " (inactivo)"}</td>
                    <td>{p.sessionRate.toLocaleString("es-PY")} Gs</td>
                    <td>{p.roomCost.toLocaleString("es-PY")} Gs</td>
                    <td>{p.perSessionFee.toLocaleString("es-PY")} Gs</td>
                    <td>
                      <div className="row-actions">
                        <button onClick={() => startEdit(p)}>Editar</button>
                        <button onClick={() => handleRemove(p)}>Eliminar</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {showForm && (
          <ProfessionalForm
            initial={editing ?? undefined}
            onSave={handleSave}
            onCancel={() => {
              setShowForm(false);
              setEditing(null);
            }}
          />
        )}
      </div>
    </div>
  );
}
