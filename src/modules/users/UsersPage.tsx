import { useState } from "react";
import { useUsers } from "./useUsers";
import CreateUserForm from "./CreateUserForm";
import type { UserProfile } from "../../types/user";

interface Props {
  currentUid: string;
  isAdmin: boolean;
}

const ROLE_LABELS: Record<UserProfile["role"], string> = {
  admin: "Administrador",
  secretary: "Secretaria",
  professional: "Profesional",
};

export default function UsersPage({ currentUid, isAdmin }: Props) {
  const [showForm, setShowForm] = useState(!isAdmin);

  if (!isAdmin) {
    // Secretaria só cria conta de profissional — não vê a lista de
    // outras contas nem bloqueia/apaga ninguém (isso fica só com admin).
    return (
      <div>
        <div className="page-header">
          <h1>Nuevo profesional</h1>
        </div>
        <CreateUserForm
          allowedRoles={["professional"]}
          onCreated={() => setShowForm(true)}
          onCancel={() => setShowForm(true)}
        />
      </div>
    );
  }

  return <AdminUsersView currentUid={currentUid} showForm={showForm} setShowForm={setShowForm} />;
}

function AdminUsersView({
  currentUid,
  showForm,
  setShowForm,
}: {
  currentUid: string;
  showForm: boolean;
  setShowForm: (v: boolean) => void;
}) {
  const { users, loading, error, setActive, removeUser } = useUsers();

  async function toggleActive(user: UserProfile) {
    await setActive(user.uid, !user.active);
  }

  async function handleRemove(user: UserProfile) {
    if (
      confirm(
        `¿Eliminar el acceso de ${user.username}? La cuenta de login en Firebase Authentication sigue existiendo (requiere eliminación manual en la Consola) — esto solo quita el acceso al sistema.`
      )
    ) {
      await removeUser(user);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Usuarios</h1>
        {!showForm && (
          <button className="btn" onClick={() => setShowForm(true)}>
            + Nuevo usuario
          </button>
        )}
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className={showForm ? "layout-split" : ""}>
        <div>
          {loading ? (
            <p>Cargando...</p>
          ) : users.length === 0 ? (
            <div className="empty-state">No se encontró ningún usuario.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Rol</th>
                  <th>Estado</th>
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
                      <td>{u.active ? "Activo" : "Bloqueado"}</td>
                      <td>
                        <div className="row-actions">
                          <button disabled={isSelf} onClick={() => toggleActive(u)}>
                            {u.active ? "Bloquear" : "Desbloquear"}
                          </button>
                          <button disabled={isSelf} onClick={() => handleRemove(u)}>
                            Eliminar
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
            No puede bloquear ni eliminar su propia cuenta.
          </p>
        </div>

        {showForm && (
          <CreateUserForm
            allowedRoles={["admin", "secretary", "professional"]}
            onCreated={() => setShowForm(false)}
            onCancel={() => setShowForm(false)}
          />
        )}
      </div>
    </div>
  );
}
