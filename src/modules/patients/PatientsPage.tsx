import { useMemo, useState } from "react";
import { usePatients } from "./usePatients";
import PatientForm from "./PatientForm";
import PatientHistoryPanel from "./PatientHistoryPanel";
import type { Patient, PatientInput } from "../../types/patient";

export default function PatientsPage() {
  const { patients, loading, error, addPatient, updatePatient, removePatient } = usePatients();
  const [editing, setEditing] = useState<Patient | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [historyOf, setHistoryOf] = useState<Patient | null>(null);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return patients;
    return patients.filter(
      (p) => p.fullName.toLowerCase().includes(term) || p.phone.includes(term)
    );
  }, [patients, search]);

  async function handleSave(input: PatientInput) {
    if (editing) {
      await updatePatient(editing.id, input);
    } else {
      await addPatient(input);
    }
    setShowForm(false);
    setEditing(null);
  }

  function startEdit(p: Patient) {
    setEditing(p);
    setShowForm(true);
  }

  function startNew() {
    setEditing(null);
    setShowForm(true);
  }

  async function handleRemove(p: Patient) {
    if (
      confirm(
        `¿Eliminar la ficha de ${p.fullName}? El historial de sesiones no se borra.`
      )
    ) {
      await removePatient(p.id);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Pacientes</h1>
        {!showForm && (
          <button className="btn" onClick={startNew}>
            + Nuevo paciente
          </button>
        )}
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className={showForm ? "layout-split" : ""}>
        <div>
          {!showForm && (
            <div className="field" style={{ maxWidth: 320 }}>
              <input
                placeholder="Buscar por nombre o teléfono..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          )}

          {loading ? (
            <p>Cargando...</p>
          ) : filtered.length === 0 ? (
            <div className="empty-state">No se encontró ningún paciente.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Teléfono</th>
                  <th>Facturación</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const defaultBilling = p.billingProfiles.find((bp) => bp.isDefault);
                  return (
                    <tr key={p.id}>
                      <td>{p.fullName}</td>
                      <td>{p.phone || "—"}</td>
                      <td>
                        {defaultBilling
                          ? `${defaultBilling.name} (${defaultBilling.ruc})`
                          : p.billingProfiles.length > 0
                          ? `${p.billingProfiles.length} perfiles`
                          : "—"}
                      </td>
                      <td>
                        <div className="row-actions">
                          <button onClick={() => setHistoryOf(p)}>Historial</button>
                          <button onClick={() => startEdit(p)}>Editar</button>
                          <button onClick={() => handleRemove(p)}>Eliminar</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {showForm && (
          <PatientForm
            initial={editing ?? undefined}
            onSave={handleSave}
            onCancel={() => {
              setShowForm(false);
              setEditing(null);
            }}
          />
        )}
      </div>

      {historyOf && (
        <PatientHistoryPanel
          patientId={historyOf.id}
          patientName={historyOf.fullName}
          onClose={() => setHistoryOf(null)}
        />
      )}
    </div>
  );
}
