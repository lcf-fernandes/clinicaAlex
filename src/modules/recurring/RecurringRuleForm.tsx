import { useMemo, useState } from "react";
import { usePatients } from "../patients/usePatients";
import { useProfessionals } from "../professionals/useProfessionals";
import { WEEKDAYS, type Weekday } from "../../types/professional";
import type { RecurringRule, RecurringRuleInput } from "../../types/recurringRule";
import { todayISO } from "../../shared/date";

interface Props {
  initial?: RecurringRule;
  onSave: (input: RecurringRuleInput) => Promise<void>;
  onCancel: () => void;
}

export default function RecurringRuleForm({ initial, onSave, onCancel }: Props) {
  const { patients } = usePatients();
  const { professionals } = useProfessionals();

  const [patientSearch, setPatientSearch] = useState(initial?.patientName ?? "");
  const [patientId, setPatientId] = useState(initial?.patientId ?? "");
  const [weekday, setWeekday] = useState<Weekday>(initial?.weekday ?? "mon");
  const [time, setTime] = useState(initial?.time ?? "08:00");
  const [professionalId, setProfessionalId] = useState(initial?.professionalId ?? "");
  const [billingProfileId, setBillingProfileId] = useState(initial?.billingProfileId ?? "");
  const [startDate, setStartDate] = useState(initial?.startDate ?? todayISO());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeProfessionals = useMemo(() => professionals.filter((p) => p.active), [professionals]);

  const patientMatches = useMemo(() => {
    const term = patientSearch.trim().toLowerCase();
    if (!term || patientId) return [];
    return patients.filter((p) => p.fullName.toLowerCase().includes(term)).slice(0, 6);
  }, [patientSearch, patientId, patients]);

  const selectedPatient = patients.find((p) => p.id === patientId);

  function pickPatient(id: string, name: string) {
    setPatientId(id);
    setPatientSearch(name);
    setBillingProfileId("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!patientId) {
      setError("Selecione um paciente da lista.");
      return;
    }
    if (!professionalId) {
      setError("Selecione um profissional.");
      return;
    }
    const professional = professionals.find((p) => p.id === professionalId);
    setSaving(true);
    setError(null);
    try {
      await onSave({
        patientId,
        patientName: patientSearch.trim(),
        weekday,
        time,
        professionalId,
        professionalName: professional?.name ?? "",
        billingProfileId: billingProfileId || undefined,
        active: initial?.active ?? true,
        startDate,
        endDate: initial?.endDate ?? null,
        exceptions: initial?.exceptions ?? [],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="panel" onSubmit={handleSubmit}>
      <h2>{initial ? "Editar paciente fixo" : "Novo paciente fixo"}</h2>
      {error && <div className="error-banner">{error}</div>}

      <div className="field" style={{ position: "relative" }}>
        <label htmlFor="patient">Paciente</label>
        <input
          id="patient"
          value={patientSearch}
          onChange={(e) => {
            setPatientSearch(e.target.value);
            setPatientId("");
          }}
          placeholder="Buscar paciente..."
          autoComplete="off"
          disabled={Boolean(initial)}
        />
        {patientMatches.length > 0 && (
          <div className="autocomplete-list">
            {patientMatches.map((p) => (
              <button
                type="button"
                key={p.id}
                className="autocomplete-item"
                onClick={() => pickPatient(p.id, p.fullName)}
              >
                {p.fullName}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor="weekday">Dia da semana</label>
          <select id="weekday" value={weekday} onChange={(e) => setWeekday(e.target.value as Weekday)}>
            {WEEKDAYS.map((w) => (
              <option key={w.key} value={w.key}>
                {w.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="time">Horário</label>
          <input id="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </div>
      </div>

      <div className="field">
        <label htmlFor="professional">Profissional</label>
        <select
          id="professional"
          value={professionalId}
          onChange={(e) => setProfessionalId(e.target.value)}
        >
          <option value="">— selecione —</option>
          {activeProfessionals.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {selectedPatient && selectedPatient.billingProfiles.length > 0 && (
        <div className="field">
          <label htmlFor="billingProfile">Facturación</label>
          <select
            id="billingProfile"
            value={billingProfileId}
            onChange={(e) => setBillingProfileId(e.target.value)}
          >
            <option value="">— padrão do paciente —</option>
            {selectedPatient.billingProfiles.map((bp) => (
              <option key={bp.id} value={bp.id}>
                {bp.name} ({bp.ruc})
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="field">
        <label htmlFor="startDate">Começa em</label>
        <input
          id="startDate"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          disabled={Boolean(initial)}
        />
      </div>

      <div className="form-actions">
        <button type="submit" className="btn" disabled={saving}>
          {saving ? "Salvando..." : "Salvar"}
        </button>
        <button type="button" className="btn secondary" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
