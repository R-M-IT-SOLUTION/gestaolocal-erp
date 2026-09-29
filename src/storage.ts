import { Database, seedDatabase } from "./domain";

const DB_KEY = "gestaolocal_db_v2";

/**
 * Atualiza uma instalação anterior sem apagar alterações feitas pelo usuário.
 * Registros que já existem mantêm seus valores; campos/itens que só existiam
 * no backup são incorporados ao banco local.
 */
function mergeBackupData(current: Database, backup: Database): Database {
  const mergeCollection = <T extends { id: string }>(existing: T[], source: T[]): T[] => {
    const result = existing.map((item) => ({ ...item }));
    for (const sourceItem of source) {
      const index = result.findIndex((item) => item.id === sourceItem.id);
      if (index === -1) result.push({ ...sourceItem });
      else result[index] = { ...sourceItem, ...result[index] };
    }
    return result;
  };

  // A versão anterior do React tinha apenas 2 títulos demonstrativos. Nesse
  // caso específico, usa-se a série completa do backup para recuperar todos.
  const oldReducedTitles = current.titulos.length <= 2 && current.titulos.some((item) => item.descricao.includes("NF 2041"));
  const titles = oldReducedTitles ? backup.titulos.map((item) => ({ ...item })) : mergeCollection(current.titulos, backup.titulos);

  return {
    clientes: mergeCollection(current.clientes, backup.clientes),
    produtos: mergeCollection(current.produtos, backup.produtos),
    bancos: mergeCollection(current.bancos, backup.bancos),
    titulos: titles,
    documentos: mergeCollection(current.documentos, backup.documentos),
    usuarios: mergeCollection(current.usuarios, backup.usuarios),
    perms: current.perms && Object.keys(current.perms).length ? current.perms : backup.perms
  };
}

export function loadDatabase(): Database {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (!raw) return seedDatabase();
    const value = JSON.parse(raw) as Partial<Database>;
    if (!value?.usuarios || !value?.perms) return seedDatabase();

    const backup = seedDatabase();
    const current: Database = {
      ...backup,
      ...value,
      clientes: value.clientes || backup.clientes,
      produtos: value.produtos || backup.produtos,
      bancos: value.bancos || backup.bancos,
      titulos: value.titulos || backup.titulos,
      documentos: value.documentos || backup.documentos,
      usuarios: value.usuarios || backup.usuarios,
      perms: value.perms || backup.perms
    };
    const migrated = mergeBackupData(current, backup);
    // Persist the migrated structure once, so all telas passam a trabalhar com
    // o mesmo conjunto de informações do backup.
    localStorage.setItem(DB_KEY, JSON.stringify(migrated));
    return migrated;
  } catch {
    return seedDatabase();
  }
}

export function saveDatabase(database: Database): void {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(database));
  } catch (error) {
    console.error("Não foi possível salvar os dados localmente.", error);
  }
}
export function loadSession(): string | null { return sessionStorage.getItem("gl_session"); }
export function saveSession(userId: string): void { sessionStorage.setItem("gl_session", userId); }
export function clearSession(): void { sessionStorage.removeItem("gl_session"); }
