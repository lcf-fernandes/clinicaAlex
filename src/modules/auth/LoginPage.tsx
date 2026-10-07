import { useState } from "react";

interface Props {
  onSignIn: (username: string, password: string) => Promise<void>;
  onResetPassword: (username: string) => Promise<void>;
}

export default function LoginPage({ onSignIn, onResetPassword }: Props) {
  const [mode, setMode] = useState<"login" | "forgot">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await onSignIn(username.trim(), password);
    } catch (err) {
      // Erros do próprio Firebase Auth (senha errada, etc.) ficam com
      // mensagem genérica, pra não revelar se o usuário existe. Já os
      // erros que nós mesmos lançamos (sem cadastro / desativado) têm
      // mensagem específica e podem ser mostrados.
      const isFirebaseAuthError =
        typeof err === "object" && err !== null && "code" in err &&
        String((err as { code: unknown }).code).startsWith("auth/");
      setError(
        isFirebaseAuthError || !(err instanceof Error)
          ? "Usuario o contraseña inválidos."
          : err.message
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await onResetPassword(username.trim());
      setResetSent(true);
    } catch {
      setError("No fue posible enviar el e-mail de recuperación. Intente de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  function backToLogin() {
    setMode("login");
    setError(null);
    setResetSent(false);
  }

  if (mode === "forgot") {
    return (
      <div className="login-screen">
        <form className="panel login-panel" onClick={(e) => e.stopPropagation()} onSubmit={handleReset}>
          <h1 className="login-title">Clínica Alex</h1>
          <p className="login-subtitle">Recuperar contraseña</p>

          {error && <div className="error-banner">{error}</div>}

          {resetSent ? (
            <>
              <p style={{ fontSize: 13.5, color: "var(--text-muted)" }}>
                Si el usuario <strong>{username}</strong> existe, enviamos un e-mail con el enlace para
                crear una nueva contraseña. Revise también la carpeta de spam.
              </p>
              <button type="button" className="btn" style={{ width: "100%" }} onClick={backToLogin}>
                Volver al inicio de sesión
              </button>
            </>
          ) : (
            <>
              <div className="field">
                <label htmlFor="resetUsername">Usuario</label>
                <input
                  id="resetUsername"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn" style={{ width: "100%" }} disabled={loading}>
                {loading ? "Enviando..." : "Enviar e-mail de recuperación"}
              </button>
              <button
                type="button"
                className="btn secondary"
                style={{ width: "100%", marginTop: 8 }}
                onClick={backToLogin}
              >
                Volver
              </button>
            </>
          )}
        </form>
      </div>
    );
  }

  return (
    <div className="login-screen">
      <form className="panel login-panel" onSubmit={handleSubmit}>
        <h1 className="login-title">Clínica Alex</h1>
        <p className="login-subtitle">Ingrese para acceder a la agenda</p>

        {error && <div className="error-banner">{error}</div>}

        <div className="field">
          <label htmlFor="username">Usuario</label>
          <input
            id="username"
            type="text"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>

        <div className="field">
          <label htmlFor="password">Contraseña</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="btn" style={{ width: "100%" }} disabled={loading}>
          {loading ? "Ingresando..." : "Ingresar"}
        </button>

        <button
          type="button"
          className="link-button"
          style={{ display: "block", margin: "12px auto 0", fontSize: 12.5 }}
          onClick={() => {
            setMode("forgot");
            setError(null);
          }}
        >
          ¿Olvidó su contraseña?
        </button>
      </form>
    </div>
  );
}
