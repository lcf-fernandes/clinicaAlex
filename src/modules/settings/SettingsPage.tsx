import { useEffect, useState } from "react";
import { useClinicSettings } from "./useClinicSettings";
import { useProfessionals } from "../professionals/useProfessionals";
import { WEEKDAYS, type Weekday } from "../../types/professional";
import type { RoomsPerWeekday } from "../../types/clinicSettings";

export default function SettingsPage() {
  const { settings, loading, save } = useClinicSettings();
  const { professionals } = useProfessionals();
  const [values, setValues] = useState<Record<Weekday, string>>(() =>
    Object.fromEntries(WEEKDAYS.map((w) => [w.key, "0"])) as Record<Weekday, string>
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!loading) {
      setValues(
        Object.fromEntries(
          WEEKDAYS.map((w) => [w.key, String(settings.roomsPerWeekday[w.key])])
        ) as Record<Weekday, string>
      );
    }
  }, [loading, settings]);

  function scheduledCount(day: Weekday) {
    return professionals.filter((p) => p.active && p.defaultSchedule[day]).length;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const roomsPerWeekday = Object.fromEntries(
      WEEKDAYS.map((w) => [w.key, Number(values[w.key]) || 0])
    ) as RoomsPerWeekday;
    setSaving(true);
    try {
      await save(roomsPerWeekday);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Configuración</h1>
      </div>

      <form className="panel" style={{ maxWidth: 480 }} onSubmit={handleSubmit}>
        <h2>Salas / profesionales simultáneos por día</h2>
        <p style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: -8 }}>
          Cuántas salas la clínica tiene disponibles en cada día de la semana — la especificación
          original menciona 8 en la mayoría de los días y 9 los miércoles, pero esto es configurable
          acá. Es solo un límite de referencia: la cantidad actual de profesionales programados
          aparece al lado, pero nada impide superar el número si hace falta.
        </p>

        {WEEKDAYS.map((w) => {
          const current = scheduledCount(w.key);
          const max = Number(values[w.key]) || 0;
          const overCapacity = max > 0 && current > max;
          return (
            <div className="field-row" key={w.key} style={{ alignItems: "center" }}>
              <div className="field" style={{ flex: "0 0 140px" }}>
                <label htmlFor={`rooms-${w.key}`}>{w.label}</label>
                <input
                  id={`rooms-${w.key}`}
                  type="number"
                  min={0}
                  value={values[w.key]}
                  onChange={(e) => setValues((prev) => ({ ...prev, [w.key]: e.target.value }))}
                />
              </div>
              <span
                style={{
                  fontSize: 12.5,
                  color: overCapacity ? "var(--danger)" : "var(--text-muted)",
                  marginTop: 18,
                }}
              >
                {current} profesional(es) programado(s) {overCapacity && "— por encima del límite configurado"}
              </span>
            </div>
          );
        })}

        <div className="form-actions">
          <button type="submit" className="btn" disabled={saving}>
            {saving ? "Guardando..." : saved ? "¡Guardado!" : "Guardar"}
          </button>
        </div>
      </form>
    </div>
  );
}
