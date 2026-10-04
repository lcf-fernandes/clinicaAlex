import { useState } from "react";
import {
  WEEKDAYS,
  type Professional,
  type ProfessionalInput,
  type Weekday,
  type WeeklySchedule,
} from "../../types/professional";
import { useProfessionals } from "./useProfessionals";
import { useClinicSettings } from "../settings/useClinicSettings";

interface Props {
  initial?: Professional;
  onSave: (input: ProfessionalInput) => Promise<void>;
  onCancel: () => void;
}

const EMPTY_SCHEDULE: WeeklySchedule = {};

export default function ProfessionalForm({ initial, onSave, onCancel }: Props) {
  const { professionals } = useProfessionals();
  const { settings } = useClinicSettings();
  const [name, setName] = useState(initial?.name ?? "");
  const [active, setActive] = useState(initial?.active ?? true);
  // String livre, não number: um <input type="number"> controlado por
  // state numérico não deixa apagar o dígito até ficar vazio (volta
  // pra "0" na hora), o que atrapalha digitar um valor novo do zero.
  const [sessionRate, setSessionRate] = useState(initial?.sessionRate?.toString() ?? "");
  const [roomCost, setRoomCost] = useState(initial?.roomCost?.toString() ?? "");
  const [perSessionFee, setPerSessionFee] = useState(initial?.perSessionFee?.toString() ?? "");
  const [schedule, setSchedule] = useState<WeeklySchedule>(
    initial?.defaultSchedule ?? EMPTY_SCHEDULE
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleDay(day: Weekday, enabled: boolean) {
    setSchedule((prev) => {
      const next = { ...prev };
      if (enabled) {
        next[day] = next[day] ?? { start: "08:00", end: "17:00", room: "" };
      } else {
        delete next[day];
      }
      return next;
    });
  }

  function occupancy(day: Weekday) {
    const current = professionals.filter(
      (p) => p.active && p.id !== initial?.id && p.defaultSchedule[day]
    ).length;
    const max = settings.roomsPerWeekday[day];
    return { current, max };
  }

  function updateDay(day: Weekday, field: "start" | "end" | "room", value: string) {
    setSchedule((prev) => ({
      ...prev,
      [day]: { ...(prev[day] ?? { start: "08:00", end: "17:00", room: "" }), [field]: value },
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Informe o nome do profissional.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave({
        name: name.trim(),
        active,
        sessionRate: Number(sessionRate.replace(",", ".")) || 0,
        roomCost: Number(roomCost.replace(",", ".")) || 0,
        perSessionFee: Number(perSessionFee.replace(",", ".")) || 0,
        defaultSchedule: schedule,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="panel" onSubmit={handleSubmit}>
      <h2>{initial ? "Editar profissional" : "Novo profissional"}</h2>
      {error && <div className="error-banner">{error}</div>}

      <div className="field">
        <label htmlFor="name">Nome</label>
        <input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex.: Alicia"
        />
      </div>

      <div className="field">
        <label>
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            style={{ width: "auto", marginRight: 6 }}
          />
          Ativo
        </label>
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor="sessionRate">Valor por sessão (Gs)</label>
          <input
            id="sessionRate"
            type="number"
            min={0}
            value={sessionRate}
            onChange={(e) => setSessionRate(e.target.value)}
            placeholder="0"
          />
        </div>
        <div className="field">
          <label htmlFor="roomCost">Custo de sala/dia (Gs)</label>
          <input
            id="roomCost"
            type="number"
            min={0}
            value={roomCost}
            onChange={(e) => setRoomCost(e.target.value)}
            placeholder="0"
          />
        </div>
        <div className="field">
          <label htmlFor="perSessionFee">Taxa por sessão (Gs)</label>
          <input
            id="perSessionFee"
            type="number"
            min={0}
            value={perSessionFee}
            onChange={(e) => setPerSessionFee(e.target.value)}
            placeholder="0"
          />
        </div>
      </div>

      <div className="field">
        <label>Escala semanal habitual</label>
        <div className="schedule-grid">
          {WEEKDAYS.map(({ key, label }) => {
            const day = schedule[key];
            const enabled = Boolean(day);
            const { current, max } = occupancy(key);
            const wouldExceed = enabled && max > 0 && current + 1 > max;
            return (
              <div className="schedule-day" key={key}>
                <label style={{ marginBottom: 0 }}>
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => toggleDay(key, e.target.checked)}
                    style={{ width: "auto", marginRight: 6 }}
                  />
                  {label}
                </label>
                <input
                  type="time"
                  disabled={!enabled}
                  value={day?.start ?? ""}
                  onChange={(e) => updateDay(key, "start", e.target.value)}
                />
                <input
                  type="time"
                  disabled={!enabled}
                  value={day?.end ?? ""}
                  onChange={(e) => updateDay(key, "end", e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Sala"
                  disabled={!enabled}
                  value={day?.room ?? ""}
                  onChange={(e) => updateDay(key, "room", e.target.value)}
                />
                <span
                  style={{
                    fontSize: 11.5,
                    color: wouldExceed ? "var(--danger)" : "var(--text-muted)",
                    alignSelf: "center",
                  }}
                >
                  {enabled && max > 0 ? `${current + 1}/${max} salas` : ""}
                </span>
              </div>
            );
          })}
        </div>
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
