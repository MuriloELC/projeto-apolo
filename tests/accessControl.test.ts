import assert from "node:assert/strict";
import test from "node:test";
import { mockUsers } from "../src/data/mockUsers";
import { canControlSystem, canManageAssets } from "../src/types/Usuario";

test("enforces the expected access matrix by profile", () => {
  assert.equal(canControlSystem("admin"), true);
  assert.equal(canManageAssets("admin"), true);

  assert.equal(canControlSystem("funcionario"), false);
  assert.equal(canManageAssets("funcionario"), true);

  assert.equal(canControlSystem("cidadao"), false);
  assert.equal(canManageAssets("cidadao"), false);
});

test("keeps demo credentials salted, hashed and costed", () => {
  const knownPlaintextPasswords = new Set(["admin123", "funcionario123", "cidadao123"]);

  for (const user of mockUsers) {
    assert.equal(knownPlaintextPasswords.has(user.passwordHash), false);
    assert.match(user.passwordSalt, /^luz-.+-v2$/);
    assert.equal(user.passwordHash.length, 64);
    assert.equal(user.passwordIterations >= 250, true);
  }
});
