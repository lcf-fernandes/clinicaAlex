import { useState } from "react";
import MyAgendaPage from "./modules/myself/MyAgendaPage";
import MySettlementPage from "./modules/myself/MySettlementPage";
import type { UserProfile } from "./types/user";

type Section = "agenda" | "settlement";

interface Props {
  profile: UserProfile;
  onSignOut: () => void;
}

export default function ProfessionalApp({ profile, onSignOut }: Props) {
  const [section, setSection] = useState<Section>("agenda");

  if (!profile.professionalId) {
    return (
      <div className="app-loading" style={{ flexDirection: "column", gap: 12 }}>
        <strong>Cuenta sin profesional vinculado.</strong>
        <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
          Hable con la administración para configurar el campo professionalId de su usuario.
        </span>
        <button className="btn secondary" onClick={onSignOut}>
          Salir
        </button>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar no-print">
        <h1>Clínica Alex</h1>
        <nav>
          <button className={section === "agenda" ? "active" : ""} onClick={() => setSection("agenda")}>
            Mi Agenda
          </button>
          <button
            className={section === "settlement" ? "active" : ""}
            onClick={() => setSection("settlement")}
          >
            Mi Liquidación
          </button>
        </nav>
        <div className="sidebar-footer">
          <span className="sidebar-user">
            {profile.professionalName ?? profile.username}
            <span className="sidebar-role"> · Profesional</span>
          </span>
          <button className="btn secondary" onClick={onSignOut}>
            Salir
          </button>
        </div>
      </aside>
      <div className="main">
        {section === "agenda" && <MyAgendaPage professionalId={profile.professionalId} />}
        {section === "settlement" && <MySettlementPage professionalId={profile.professionalId} />}
      </div>
    </div>
  );
}
