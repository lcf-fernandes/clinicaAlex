/**
 * CSV pensado pra abrir direto no Excel em espanhol/português:
 * - separador ";" (com vírgula, o Excel em locale es/pt joga tudo numa
 *   coluna só, porque a vírgula é o separador decimal dessas regiões)
 * - BOM UTF-8 no começo, senão os acentos (ó, ñ) saem quebrados
 */
function escapeCell(value: unknown): string {
  const text = value === null || value === undefined ? "" : String(value);
  return /[;"\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(headers: string[], rows: unknown[][]): string {
  const lines = [headers, ...rows].map((row) => row.map(escapeCell).join(";"));
  return "\uFEFF" + lines.join("\r\n");
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
