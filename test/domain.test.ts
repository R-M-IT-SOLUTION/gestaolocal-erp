import test from "node:test";
import assert from "node:assert/strict";
import { defaultPermissions, hash, seedDatabase } from "../src/domain";

test("seed creates the demo users and fiscal documents", () => {
  const database = seedDatabase();
  assert.equal(database.usuarios.length, 3);
  assert.equal(database.documentos.length, 3);
  assert.ok(database.perms.admin?.usuarios?.includes("excluir"));
});

test("demo password hash is deterministic", () => {
  assert.equal(hash("gl::admin123"), hash("gl::admin123"));
  assert.notEqual(hash("gl::admin123"), hash("gl::wrong"));
});

test("default permissions isolate employee access", () => {
  const permissions = defaultPermissions();
  assert.deepEqual(permissions.funcionario?.produtos, ["ver", "incluir", "alterar", "excluir"]);
  assert.equal(permissions.funcionario?.clientes, undefined);
});
