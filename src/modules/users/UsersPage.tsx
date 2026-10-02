import { useUsers } from "./useUsers";
import type { UserProfile } from "../../types/user";

interface Props {
  currentUid: string;
}

export default function UsersPage({ currentUid }: Props) {
  const { users, loading, error, setActive, removeUser } = useUsers();

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
      </div>

      {error && <div className="error-banner">{error}</div>}

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
                  <td>{u.username}</td>
                  <td>{u.role === "admin" ? "Administrador" : "Secretaria"}</td>
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
  );
}
