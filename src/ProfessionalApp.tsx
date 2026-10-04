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
        <strong>Conta sem profissional vinculado.</strong>
        <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
          Fala com a administração pra configurar o campo professionalId do seu usuário.
        </span>
        <button className="btn secondary" onClick={onSignOut}>
          Sair
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
            Minha Agenda
          </button>
          <button
            className={section === "settlement" ? "active" : ""}
            onClick={() => setSection("settlement")}
          >
            Minha Liquidação
          </button>
        </nav>
        <div className="sidebar-footer">
          <span className="sidebar-user">
            {profile.professionalName ?? profile.username}
            <span className="sidebar-role"> · Profissional</span>
          </span>
          <button className="btn secondary" onClick={onSignOut}>
            Sair
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
