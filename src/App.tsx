import { useState } from "react";
import ProfessionalsPage from "./modules/professionals/ProfessionalsPage";
import PatientsPage from "./modules/patients/PatientsPage";
import UsersPage from "./modules/users/UsersPage";
import LoginPage from "./modules/auth/LoginPage";
import { useAuth } from "./shared/auth/useAuth";

type Section = "professionals" | "patients" | "users";

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

  const isAdmin = profile?.role === "admin";
  const sections = isAdmin ? [...SECTIONS, { key: "users" as const, label: "Usuários" }] : SECTIONS;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <h1>Clínica Alex</h1>
        <nav>
          {sections.map((s) => (
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
        {section === "users" && isAdmin && <UsersPage currentUid={user.uid} />}
      </div>
    </div>
  );
}
