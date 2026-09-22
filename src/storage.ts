import { Database, seedDatabase } from "./domain";

const DB_KEY = "gestaolocal_db_v2";
export function loadDatabase(): Database {
  try {
    const raw = localStorage.getItem(DB_KEY);
    const value: Partial<Database> | null = raw ? JSON.parse(raw) : null;
    if (!value?.usuarios || !value?.perms) return seedDatabase();
    const demo = seedDatabase();
    return {
      ...demo,
      ...value,
      bancos: value.bancos?.length ? value.bancos : demo.bancos,
      documentos: value.documentos?.length ? value.documentos : demo.documentos,
      titulos: value.titulos?.length ? value.titulos : demo.titulos
    };
  } catch {
    return seedDatabase();
  }
}
export function saveDatabase(database: Database): void {
  localStorage.setItem(DB_KEY, JSON.stringify(database));
}
export function loadSession(): string | null {
  return sessionStorage.getItem("gl_session");
}
export function saveSession(userId: string): void {
  sessionStorage.setItem("gl_session", userId);
}
export function clearSession() {
  sessionStorage.removeItem("gl_session");
}
