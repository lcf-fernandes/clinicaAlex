import { useState } from "react";
import AgendaPage from "./modules/agenda/AgendaPage";
import ProfessionalsPage from "./modules/professionals/ProfessionalsPage";
import PatientsPage from "./modules/patients/PatientsPage";
import PaymentsPage from "./modules/payments/PaymentsPage";
import RecurringRulesPage from "./modules/recurring/RecurringRulesPage";
import WaitlistPage from "./modules/waitlist/WaitlistPage";
import SettlementPage from "./modules/settlement/SettlementPage";
import UsersPage from "./modules/users/UsersPage";
import SettingsPage from "./modules/settings/SettingsPage";
import LoginPage from "./modules/auth/LoginPage";
import ProfessionalApp from "./ProfessionalApp";
import { useAuth } from "./shared/auth/useAuth";

type Section =
  | "agenda"
  | "professionals"
  | "patients"
  | "recurring"
  | "waitlist"
  | "payments"
  | "settlement"
  | "users"
  | "settings";

const SECTIONS: { key: Section; label: string }[] = [
  { key: "agenda", label: "Agenda" },
  { key: "professionals", label: "Profesionales" },
  { key: "patients", label: "Pacientes" },
  { key: "recurring", label: "Pacientes fijos" },
  { key: "waitlist", label: "Lista de espera" },
  { key: "payments", label: "Pagos" },
  { key: "settlement", label: "Liquidación" },
];

export default function App() {
  const [section, setSection] = useState<Section>("agenda");
  const { user, profile, loading, signIn, signOut } = useAuth();

  if (loading) {
    return <div className="app-loading">Cargando...</div>;
  }

  if (!user) {
    return <LoginPage onSignIn={signIn} />;
  }

  if (profile?.role === "professional") {
    return <ProfessionalApp profile={profile} onSignOut={signOut} />;
  }

  const isAdmin = profile?.role === "admin";
  const sections = [
    ...SECTIONS,
    { key: "users" as const, label: "Usuarios" },
    ...(isAdmin ? [{ key: "settings" as const, label: "Configuración" }] : []),
  ];

  return (
    <div className="app-shell">
      <aside className="sidebar no-print">
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
            Salir
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
        {section === "settlement" && <SettlementPage />}
        {section === "users" && <UsersPage currentUid={user.uid} isAdmin={isAdmin} />}
        {section === "settings" && isAdmin && <SettingsPage />}
      </div>
    </div>
  );
}
