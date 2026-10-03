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
    if (confirm(`Encerrar o turno fixo de ${rule.patientName}? O histórico de sessões não é afetado.`)) {
      await endRule(rule.id, todayISO());
    }
  }

  async function handleReactivate(rule: RecurringRule) {
    await updateRule(rule.id, { active: true, endDate: null });
  }

  async function handleRemove(rule: RecurringRule) {
    if (confirm(`Apagar completamente a regra de ${rule.patientName}? Isso não pode ser desfeito.`)) {
      await removeRule(rule.id);
    }
  }

  async function handleSaveException(rule: RecurringRule, exception: RecurringException) {
    await addException(rule, exception);
  }

  return (
    <div>
      <div className="page-header">
        <h1>Pacientes fixos</h1>
        {!showForm && (
          <button className="btn" onClick={startNew}>
            + Novo paciente fixo
          </button>
        )}
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className={showForm ? "layout-split" : ""}>
        <div>
          {loading ? (
            <p>Carregando...</p>
          ) : rules.length === 0 ? (
            <div className="empty-state">Nenhum paciente fixo cadastrado ainda.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Paciente</th>
                  <th>Dia / horário</th>
                  <th>Profissional</th>
                  <th>Status</th>
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
                        {rule.active ? "Ativo" : `Encerrado em ${rule.endDate ?? "—"}`}
                        {rule.exceptions.length > 0 && (
                          <>
                            {" · "}
                            <button
                              type="button"
                              className="link-button"
                              onClick={() => setExpanded(expanded === rule.id ? null : rule.id)}
                            >
                              {rule.exceptions.length} exceção(ões)
                            </button>
                          </>
                        )}
                      </td>
                      <td>
                        <div className="row-actions">
                          {rule.active && (
                            <button onClick={() => setExceptionFor(rule)}>+ Exceção</button>
                          )}
                          <button onClick={() => startEdit(rule)}>Editar</button>
                          {rule.active ? (
                            <button onClick={() => handleEnd(rule)}>Encerrar</button>
                          ) : (
                            <button onClick={() => handleReactivate(rule)}>Reativar</button>
                          )}
                          <button onClick={() => handleRemove(rule)}>Apagar</button>
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
                                {ex.action === "cancel" && "não vem"}
                                {ex.action === "reassign" && `atende com ${ex.newProfessionalName}`}
                                {ex.action === "reschedule" && `muda para ${ex.newTime}`}
                                {ex.note && ` (${ex.note})`}{" "}
                                <button
                                  type="button"
                                  className="link-button"
                                  onClick={() => removeException(rule, ex.date)}
                                >
                                  remover
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
