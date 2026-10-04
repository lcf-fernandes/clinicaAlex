import { useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase/config";
import { createAuthAccount } from "../../shared/auth/createAuthAccount";
import { setDocById } from "../../shared/firestore/crud";
import { useProfessionals } from "../professionals/useProfessionals";
import { DEFAULT_PERMISSIONS, type UserRole } from "../../types/user";

interface Props {
  onCreated: () => void;
  onCancel: () => void;
}

const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Administrador",
  secretary: "Secretaria",
  professional: "Profissional (só visualiza a própria agenda/liquidação)",
};

export default function CreateUserForm({ onCreated, onCancel }: Props) {
  const { professionals } = useProfessionals();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("secretary");
  const [professionalId, setProfessionalId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cleanUsername = username.trim();
    if (!cleanUsername || !email.trim() || !password) {
      setError("Preencha usuário, e-mail e senha.");
      return;
    }
    if (password.length < 6) {
      setError("A senha precisa ter pelo menos 6 caracteres (mínimo do Firebase).");
      return;
    }
    if (role === "professional" && !professionalId) {
      setError("Selecione a qual profissional essa conta pertence.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const usernameDoc = await getDoc(doc(db, "usernames", cleanUsername));
      if (usernameDoc.exists()) {
        setError(`Já existe uma conta com o usuário "${cleanUsername}".`);
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
      const message = err instanceof Error ? err.message : "Erro ao criar usuário.";
      setError(
        message.includes("auth/email-already-in-use")
          ? "Já existe uma conta de Authentication com esse e-mail."
          : message
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="panel" onSubmit={handleSubmit}>
      <h2>Novo usuário</h2>
      {error && <div className="error-banner">{error}</div>}

      <div className="field">
        <label htmlFor="newUsername">Usuário (pra digitar no login)</label>
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
        <label htmlFor="newPassword">Senha inicial</label>
        <input
          id="newPassword"
          type="text"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="mín. 6 caracteres"
        />
      </div>

      <div className="field">
        <label htmlFor="newRole">Papel</label>
        <select id="newRole" value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
          {Object.entries(ROLE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {role === "professional" && (
        <div className="field">
          <label htmlFor="newProfessional">Vincular ao profissional</label>
          <select
            id="newProfessional"
            value={professionalId}
            onChange={(e) => setProfessionalId(e.target.value)}
          >
            <option value="">— selecione —</option>
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
          {saving ? "Criando..." : "Criar usuário"}
        </button>
        <button type="button" className="btn secondary" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
