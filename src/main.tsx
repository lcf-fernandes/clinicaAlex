import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import ErrorBoundary from "./shared/components/ErrorBoundary";
import "./index.css";

const root = createRoot(document.getElementById("root")!);

// Import dinâmico (não `import App from "./App"` estático): assim, se
// algo quebrar durante a inicialização do módulo (ex.: variáveis de
// ambiente do Firebase ausentes), conseguimos capturar o erro aqui em
// vez de deixar a tela em branco sem nenhuma mensagem.
import("./App")
  .then(({ default: App }) => {
    root.render(
      <StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </StrictMode>
    );
  })
  .catch((err: unknown) => {
    const message = err instanceof Error ? err.message : String(err);
    root.render(
      <div
        className="app-loading"
        style={{ flexDirection: "column", gap: 12, padding: 24, textAlign: "center" }}
      >
        <strong>Não foi possível carregar a aplicação.</strong>
        <span style={{ maxWidth: 480, fontSize: 13, color: "var(--text-muted)" }}>
          {message}
        </span>
      </div>
    );
  });
