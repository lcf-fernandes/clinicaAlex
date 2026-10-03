import { useState } from "react";
import AgendaPage from "./modules/agenda/AgendaPage";
import ProfessionalsPage from "./modules/professionals/ProfessionalsPage";
import PatientsPage from "./modules/patients/PatientsPage";
import PaymentsPage from "./modules/payments/PaymentsPage";
import RecurringRulesPage from "./modules/recurring/RecurringRulesPage";
import WaitlistPage from "./modules/waitlist/WaitlistPage";
import UsersPage from "./modules/users/UsersPage";
import LoginPage from "./modules/auth/LoginPage";
import { useAuth } from "./shared/auth/useAuth";

type Section = "agenda" | "professionals" | "patients" | "recurring" | "waitlist" | "payments" | "users";

const SECTIONS: { key: Section; label: string }[] = [
  { key: "agenda", label: "Agenda" },
  { key: "professionals", label: "Profissionais" },
  { key: "patients", label: "Pacientes" },
  { key: "recurring", label: "Pacientes fixos" },
  { key: "waitlist", label: "Lista de espera" },
  { key: "payments", label: "Pagamentos" },
];

export default function App() {
  const [section, setSection] = useState<Section>("agenda");
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
        {section === "agenda" && <AgendaPage />}
        {section === "professionals" && <ProfessionalsPage />}
        {section === "patients" && <PatientsPage />}
        {section === "recurring" && <RecurringRulesPage />}
        {section === "waitlist" && <WaitlistPage />}
        {section === "payments" && <PaymentsPage />}
        {section === "users" && isAdmin && <UsersPage currentUid={user.uid} />}
      </div>
    </div>
  );
}
