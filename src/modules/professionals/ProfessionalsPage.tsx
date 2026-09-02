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
    if (confirm(`Remover ${p.name}? Sessões já registradas não são afetadas.`)) {
      await removeProfessional(p.id);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Profissionais</h1>
        {!showForm && (
          <button className="btn" onClick={startNew}>
            + Novo profissional
          </button>
        )}
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className={showForm ? "layout-split" : ""}>
        <div>
          {loading ? (
            <p>Carregando...</p>
          ) : professionals.length === 0 ? (
            <div className="empty-state">Nenhum profissional cadastrado ainda.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Valor/sessão</th>
                  <th>Sala/dia</th>
                  <th>Taxa</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {professionals.map((p) => (
                  <tr key={p.id} className={p.active ? "" : "inactive"}>
                    <td>{p.name}{!p.active && " (inativo)"}</td>
                    <td>{p.sessionRate.toLocaleString("es-PY")} Gs</td>
                    <td>{p.roomCost.toLocaleString("es-PY")} Gs</td>
                    <td>{p.perSessionFee.toLocaleString("es-PY")} Gs</td>
                    <td>
                      <div className="row-actions">
                        <button onClick={() => startEdit(p)}>Editar</button>
                        <button onClick={() => handleRemove(p)}>Remover</button>
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
