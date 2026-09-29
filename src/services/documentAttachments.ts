import { DocumentRecord } from "../domain";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_EXTENSIONS = [".pdf", ".xml", ".png", ".jpg", ".jpeg", ".webp"];

export async function storeAttachment(file: File | undefined, existing: DocumentRecord): Promise<DocumentRecord> {
  if (!file) throw new Error("Selecione um arquivo.");
  if (file.size > MAX_FILE_SIZE) throw new Error("O arquivo deve ter no máximo 10 MB.");

  const lowerName = file.name.toLowerCase();
  if (!ALLOWED_EXTENSIONS.some((extension) => lowerName.endsWith(extension))) {
    throw new Error("Formato não permitido. Use PDF, XML, JPG, PNG ou WEBP.");
  }

  return {
    ...existing,
    arquivoNome: file.name,
    arquivoTipo: file.type || "application/octet-stream",
    arquivoTamanho: file.size,
    driveUrl: existing.driveUrl || "",
    anexoAtualizadoEm: new Date().toISOString()
  };
}
