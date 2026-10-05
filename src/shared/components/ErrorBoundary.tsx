import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Sem isso, qualquer erro de inicialização (ex.: variáveis de ambiente
 * do Firebase faltando) derruba a árvore inteira do React e deixa uma
 * tela em branco, sem nenhuma pista do que houve. Aqui mostramos o
 * motivo direto na tela.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Erro na aplicação:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      const missingFirebaseEnv = this.state.error.message.includes("api-key") ||
        this.state.error.message.toLowerCase().includes("firebase");
      return (
        <div className="app-loading" style={{ flexDirection: "column", gap: 12, padding: 24, textAlign: "center" }}>
          <strong>No fue posible cargar la aplicación.</strong>
          <span style={{ maxWidth: 480, fontSize: 13, color: "var(--text-muted)" }}>
            {missingFirebaseEnv
              ? "Parece que faltan configurar las variables de entorno de Firebase (VITE_FIREBASE_*) en este ambiente. Revise el README (sección Rodando localmente) o las variables de entorno del proyecto en Vercel."
              : this.state.error.message}
          </span>
        </div>
      );
    }
    return this.props.children;
  }
}
