import { useState } from "react";
import AgendaPage from "./modules/agenda/AgendaPage";
import ProfessionalsPage from "./modules/professionals/ProfessionalsPage";
import PatientsPage from "./modules/patients/PatientsPage";
import PaymentsPage from "./modules/payments/PaymentsPage";
import RecurringRulesPage from "./modules/recurring/RecurringRulesPage";
import WaitlistPage from "./modules/waitlist/WaitlistPage";
import SettlementPage from "./modules/settlement/SettlementPage";
import MonthlyReportPage from "./modules/reports/MonthlyReportPage";
import UsersPage from "./modules/users/UsersPage";
import SettingsPage from "./modules/settings/SettingsPage";
import AuditLogPage from "./modules/audit/AuditLogPage";
import ExportPage from "./modules/export/ExportPage";
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
  | "reports"
  | "users"
  | "audit"
  | "export"
  | "settings";

const SECTIONS: { key: Section; label: string }[] = [
  { key: "agenda", label: "Agenda" },
  { key: "professionals", label: "Profesionales" },
  { key: "patients", label: "Pacientes" },
  { key: "recurring", label: "Pacientes fijos" },
  { key: "waitlist", label: "Lista de espera" },
  { key: "payments", label: "Pagos" },
  { key: "settlement", label: "Liquidación" },
  { key: "reports", label: "Reporte mensual" },
];

export default function App() {
  const [section, setSection] = useState<Section>("agenda");
  const { user, profile, loading, signIn, signOut, resetPasswordByUsername } = useAuth();

  if (loading) {
    return <div className="app-loading">Cargando...</div>;
  }

  if (!user) {
    return <LoginPage onSignIn={signIn} onResetPassword={resetPasswordByUsername} />;
  }

  if (profile?.role === "professional") {
    return <ProfessionalApp profile={profile} onSignOut={signOut} />;
  }

  const isAdmin = profile?.role === "admin";
  const sections = [
    ...SECTIONS,
    { key: "users" as const, label: "Usuarios" },
    ...(isAdmin
      ? [
          { key: "audit" as const, label: "Historial de acciones" },
          { key: "export" as const, label: "Exportar datos" },
          { key: "settings" as const, label: "Configuración" },
        ]
      : []),
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
        {section === "reports" && <MonthlyReportPage />}
        {section === "users" && <UsersPage currentUid={user.uid} isAdmin={isAdmin} />}
        {section === "audit" && isAdmin && <AuditLogPage />}
        {section === "export" && isAdmin && <ExportPage />}
        {section === "settings" && isAdmin && <SettingsPage />}
      </div>
    </div>
  );
}
