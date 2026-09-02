import { useState } from "react";
import ProfessionalsPage from "./modules/professionals/ProfessionalsPage";
import PatientsPage from "./modules/patients/PatientsPage";
import LoginPage from "./modules/auth/LoginPage";
import { useAuth } from "./shared/auth/useAuth";

type Section = "professionals" | "patients";

const SECTIONS: { key: Section; label: string }[] = [
  { key: "professionals", label: "Profissionais" },
  { key: "patients", label: "Pacientes" },
];

export default function App() {
  const [section, setSection] = useState<Section>("professionals");
  const { user, profile, loading, signIn, signOut } = useAuth();

  if (loading) {
    return <div className="app-loading">Carregando...</div>;
  }

  if (!user) {
    return <LoginPage onSignIn={signIn} />;
  }

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
        <div className="sidebar-footer">
          <span className="sidebar-user">
            {profile?.username ?? user.email}
            {profile && <span className="sidebar-role"> · {profile.role === "admin" ? "Administrador" : "Secretaria"}</span>}
          </span>
          <button className="btn secondary" onClick={signOut}>
            Sair
          </button>
        </div>
      </aside>
      <div className="main">
        {section === "professionals" && <ProfessionalsPage />}
        {section === "patients" && <PatientsPage />}
      </div>
    </div>
  );
}
