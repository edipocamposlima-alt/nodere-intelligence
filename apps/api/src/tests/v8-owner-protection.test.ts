import assert from "node:assert/strict";
import test from "node:test";
import { isProtectedOwnerMutation } from "../services/userStore.js";

const owner = { email: "edipo.lima@nodere.com.br", role: "owner" as const };

test("OWNER canônico não pode ser rebaixado, desativado ou restringido", () => {
  assert.equal(isProtectedOwnerMutation(owner, owner.email, { role: "admin" }), true);
  assert.equal(isProtectedOwnerMutation(owner, owner.email, { active: false }), true);
  assert.equal(isProtectedOwnerMutation(owner, owner.email, { status: "restricted" }), true);
  assert.equal(isProtectedOwnerMutation(owner, owner.email, { visibilityLevel: "read" }), true);
});

test("OWNER pode atualizar dados que não reduzem sua proteção", () => {
  assert.equal(isProtectedOwnerMutation(owner, owner.email, { role: "owner", active: true, status: "active", visibilityLevel: "full" }), false);
});

test("usuário comum não é confundido com o OWNER canônico", () => {
  assert.equal(isProtectedOwnerMutation({ email: "operador@nodere.com.br", role: "operator" }, owner.email, { active: false }), false);
});
