import { useState } from "react";

interface Props {
  onSignIn: (username: string, password: string) => Promise<void>;
}

export default function LoginPage({ onSignIn }: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
      </form>
    </div>
  );
}
