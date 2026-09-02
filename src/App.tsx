import { useState } from "react";
import ProfessionalsPage from "./modules/professionals/ProfessionalsPage";
import PatientsPage from "./modules/patients/PatientsPage";

type Section = "professionals" | "patients";

const SECTIONS: { key: Section; label: string }[] = [
  { key: "professionals", label: "Profissionais" },
  { key: "patients", label: "Pacientes" },
];

export default function App() {
  const [section, setSection] = useState<Section>("professionals");

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <h1>Clínica Alex</h1>
        <nav>
          {SECTIONS.map((s) => (
            <button
              key={s.key}
              className={s.key === section ? "active" : ""}
              onClick={() => setSection(s.key)}
            >
              {s.label}
            </button>
          ))}
        </nav>
      </aside>
      <div className="main">
        {section === "professionals" && <ProfessionalsPage />}
        {section === "patients" && <PatientsPage />}
      </div>
    </div>
  );
}
