import { Fragment, useState } from "react";
import { useRecurringRules } from "./useRecurringRules";
import RecurringRuleForm from "./RecurringRuleForm";
import ExceptionModal from "./ExceptionModal";
import { WEEKDAYS } from "../../types/professional";
import type { RecurringException, RecurringRule, RecurringRuleInput } from "../../types/recurringRule";
import { todayISO } from "../../shared/date";

const WEEKDAY_LABEL = Object.fromEntries(WEEKDAYS.map((w) => [w.key, w.label]));

export default function RecurringRulesPage() {
  const { rules, loading, error, addRule, updateRule, removeRule, endRule, addException, removeException } =
    useRecurringRules();
  const [editing, setEditing] = useState<RecurringRule | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [exceptionFor, setExceptionFor] = useState<RecurringRule | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  async function handleSave(input: RecurringRuleInput) {
    if (editing) {
      await updateRule(editing.id, input);
    } else {
      await addRule(input);
    }
    setShowForm(false);
    setEditing(null);
  }

  function startNew() {
    setEditing(null);
    setShowForm(true);
  }

  function startEdit(rule: RecurringRule) {
    setEditing(rule);
    setShowForm(true);
  }

  async function handleEnd(rule: RecurringRule) {
    if (confirm(`¿Finalizar el turno fijo de ${rule.patientName}? El historial de sesiones no se ve afectado.`)) {
      await endRule(rule.id, todayISO());
    }
  }

  async function handleReactivate(rule: RecurringRule) {
    await updateRule(rule.id, { active: true, endDate: null });
  }

  async function handleRemove(rule: RecurringRule) {
    if (confirm(`¿Eliminar por completo la regla de ${rule.patientName}? Esto no se puede deshacer.`)) {
      await removeRule(rule.id);
    }
  }

  async function handleSaveException(rule: RecurringRule, exception: RecurringException) {
    await addException(rule, exception);
  }

  return (
    <div>
      <div className="page-header">
        <h1>Pacientes fijos</h1>
        {!showForm && (
          <button className="btn" onClick={startNew}>
            + Nuevo paciente fijo
          </button>
        )}
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className={showForm ? "layout-split" : ""}>
        <div>
          {loading ? (
            <p>Cargando...</p>
          ) : rules.length === 0 ? (
            <div className="empty-state">Todavía no hay pacientes fijos registrados.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Paciente</th>
                  <th>Día / horario</th>
                  <th>Profesional</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rules.map((rule) => (
                  <Fragment key={rule.id}>
                    <tr className={rule.active ? "" : "inactive"}>
                      <td>{rule.patientName}</td>
                      <td>
                        {WEEKDAY_LABEL[rule.weekday]} {rule.time}
                      </td>
                      <td>{rule.professionalName}</td>
                      <td>
                        {rule.active ? "Activo" : `Finalizado el ${rule.endDate ?? "—"}`}
                        {rule.exceptions.length > 0 && (
                          <>
                            {" · "}
                            <button
                              type="button"
                              className="link-button"
                              onClick={() => setExpanded(expanded === rule.id ? null : rule.id)}
                            >
                              {rule.exceptions.length} excepción(es)
                            </button>
                          </>
                        )}
                      </td>
                      <td>
                        <div className="row-actions">
                          {rule.active && (
                            <button onClick={() => setExceptionFor(rule)}>+ Excepción</button>
                          )}
                          <button onClick={() => startEdit(rule)}>Editar</button>
                          {rule.active ? (
                            <button onClick={() => handleEnd(rule)}>Finalizar</button>
                          ) : (
                            <button onClick={() => handleReactivate(rule)}>Reactivar</button>
                          )}
                          <button onClick={() => handleRemove(rule)}>Eliminar</button>
                        </div>
                      </td>
                    </tr>
                    {expanded === rule.id && rule.exceptions.length > 0 && (
                      <tr>
                        <td colSpan={5} style={{ background: "var(--bg)" }}>
                          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5 }}>
                            {rule.exceptions.map((ex) => (
                              <li key={ex.date} style={{ marginBottom: 4 }}>
                                <strong>{ex.date.split("-").reverse().join("/")}</strong> —{" "}
                                {ex.action === "cancel" && "no viene"}
                                {ex.action === "reassign" && `atiende con ${ex.newProfessionalName}`}
                                {ex.action === "reschedule" && `cambia para ${ex.newTime}`}
                                {ex.note && ` (${ex.note})`}{" "}
                                <button
                                  type="button"
                                  className="link-button"
                                  onClick={() => removeException(rule, ex.date)}
                                >
                                  eliminar
                                </button>
                              </li>
                            ))}
                          </ul>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {showForm && (
          <RecurringRuleForm
            initial={editing ?? undefined}
            onSave={handleSave}
            onCancel={() => {
              setShowForm(false);
              setEditing(null);
            }}
          />
        )}
      </div>

      {exceptionFor && (
        <ExceptionModal
          rule={exceptionFor}
          onSave={(exception) => handleSaveException(exceptionFor, exception)}
          onClose={() => setExceptionFor(null)}
        />
      )}
    </div>
  );
}
