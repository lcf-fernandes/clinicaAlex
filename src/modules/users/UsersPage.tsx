import { useState } from "react";
import { useUsers } from "./useUsers";
import CreateUserForm from "./CreateUserForm";
import type { UserProfile } from "../../types/user";

interface Props {
  currentUid: string;
}

const ROLE_LABELS: Record<UserProfile["role"], string> = {
  admin: "Administrador",
  secretary: "Secretaria",
  professional: "Profissional",
};

export default function UsersPage({ currentUid }: Props) {
  const { users, loading, error, setActive, removeUser } = useUsers();
  const [showForm, setShowForm] = useState(false);

  async function toggleActive(user: UserProfile) {
    await setActive(user.uid, !user.active);
  }

  async function handleRemove(user: UserProfile) {
    if (
      confirm(
        `Apagar o acesso de ${user.username}? A conta de login no Firebase Authentication continua existindo (requer remoção manual no Console) — isso só remove o acesso ao sistema.`
      )
    ) {
      await removeUser(user);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Usuários</h1>
        {!showForm && (
          <button className="btn" onClick={() => setShowForm(true)}>
            + Novo usuário
          </button>
        )}
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className={showForm ? "layout-split" : ""}>
        <div>
          {loading ? (
            <p>Carregando...</p>
          ) : users.length === 0 ? (
            <div className="empty-state">Nenhum usuário encontrado.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Usuário</th>
                  <th>Papel</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isSelf = u.uid === currentUid;
                  return (
                    <tr key={u.uid} className={u.active ? "" : "inactive"}>
                      <td>
                        {u.username}
                        {u.professionalName && ` (${u.professionalName})`}
                      </td>
                      <td>{ROLE_LABELS[u.role]}</td>
                      <td>{u.active ? "Ativo" : "Bloqueado"}</td>
                      <td>
                        <div className="row-actions">
                          <button disabled={isSelf} onClick={() => toggleActive(u)}>
                            {u.active ? "Bloquear" : "Desbloquear"}
                          </button>
                          <button disabled={isSelf} onClick={() => handleRemove(u)}>
                            Apagar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          <p style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 16 }}>
            Você não pode bloquear ou apagar a própria conta.
          </p>
        </div>

        {showForm && (
          <CreateUserForm onCreated={() => setShowForm(false)} onCancel={() => setShowForm(false)} />
        )}
      </div>
    </div>
  );
}
