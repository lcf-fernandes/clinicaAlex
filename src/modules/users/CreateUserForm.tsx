import { useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase/config";
import { createAuthAccount } from "../../shared/auth/createAuthAccount";
import { setDocById } from "../../shared/firestore/crud";
import { useProfessionals } from "../professionals/useProfessionals";
import { DEFAULT_PERMISSIONS, type UserRole } from "../../types/user";

interface Props {
  allowedRoles: UserRole[];
  onCreated: () => void;
  onCancel: () => void;
}

const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Administrador",
  secretary: "Secretaria",
  professional: "Profesional (solo visualiza su propia agenda/liquidación)",
};

export default function CreateUserForm({ allowedRoles, onCreated, onCancel }: Props) {
  const { professionals } = useProfessionals();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>(allowedRoles[0]);
  const [professionalId, setProfessionalId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cleanUsername = username.trim();
    if (!cleanUsername || !email.trim() || !password) {
      setError("Complete usuario, e-mail y contraseña.");
      return;
    }
    if (password.length < 6) {
      setError("La contraseña necesita tener al menos 6 caracteres (mínimo de Firebase).");
      return;
    }
    if (role === "professional" && !professionalId) {
      setError("Seleccione a qué profesional pertenece esta cuenta.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const usernameDoc = await getDoc(doc(db, "usernames", cleanUsername));
      if (usernameDoc.exists()) {
        setError(`Ya existe una cuenta con el usuario "${cleanUsername}".`);
        setSaving(false);
        return;
      }

      const uid = await createAuthAccount(email.trim(), password);

      const professional = professionals.find((p) => p.id === professionalId);

      await setDocById("users", uid, {
        username: cleanUsername,
        role,
        active: true,
        permissions: DEFAULT_PERMISSIONS[role],
        ...(role === "professional"
          ? { professionalId, professionalName: professional?.name }
          : {}),
      });
      await setDocById("usernames", cleanUsername, { email: email.trim(), uid });

      onCreated();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al crear usuario.";
      setError(
        message.includes("auth/email-already-in-use")
          ? "Ya existe una cuenta de Authentication con ese e-mail."
          : message
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="panel" onSubmit={handleSubmit}>
      <h2>Nuevo usuario</h2>
      {error && <div className="error-banner">{error}</div>}

      <div className="field">
        <label htmlFor="newUsername">Usuario (para escribir en el login)</label>
        <input id="newUsername" value={username} onChange={(e) => setUsername(e.target.value)} />
      </div>

      <div className="field">
        <label htmlFor="newEmail">E-mail</label>
        <input
          id="newEmail"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div className="field">
        <label htmlFor="newPassword">Contraseña inicial</label>
        <input
          id="newPassword"
          type="text"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="mín. 6 caracteres"
        />
      </div>

      {allowedRoles.length > 1 && (
        <div className="field">
          <label htmlFor="newRole">Rol</label>
          <select id="newRole" value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
            {allowedRoles.map((value) => (
              <option key={value} value={value}>
                {ROLE_LABELS[value]}
              </option>
            ))}
          </select>
        </div>
      )}

      {role === "professional" && (
        <div className="field">
          <label htmlFor="newProfessional">Vincular al profesional</label>
          <select
            id="newProfessional"
            value={professionalId}
            onChange={(e) => setProfessionalId(e.target.value)}
          >
            <option value="">— seleccione —</option>
            {professionals
              .filter((p) => p.active)
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
          </select>
        </div>
      )}

      <div className="form-actions">
        <button type="submit" className="btn" disabled={saving}>
          {saving ? "Creando..." : "Crear usuario"}
        </button>
        <button type="button" className="btn secondary" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
