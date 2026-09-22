import { DocumentRecord } from "../domain";

export async function storeAttachment(file: File | undefined, existing: DocumentRecord): Promise<DocumentRecord> {
  if (!file) throw new Error("Selecione um arquivo.");
  return {
    ...existing,
    arquivoNome: file.name,
    arquivoTipo: file.type || "application/octet-stream",
    arquivoTamanho: file.size,
    driveUrl: existing.driveUrl || "",
    anexoAtualizadoEm: new Date().toISOString()
  };
}
