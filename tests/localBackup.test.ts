import assert from "node:assert/strict";
import test from "node:test";
import { mockDenuncias } from "../src/data/mockDenuncias";
import { mockOrdens } from "../src/data/mockOrdens";
import { mockPostes } from "../src/data/mockPostes";
import { buildLocalBackupJson, parseLocalBackupJson } from "../src/utils/localBackup";

test("builds a versioned local backup with counts and actor metadata", () => {
  const json = buildLocalBackupJson({
    postes: mockPostes,
    ordens: mockOrdens,
    denuncias: mockDenuncias,
    auditLogs: [],
    syncQueue: [],
    currentUser: {
      id: "usr-admin",
      nome: "Admin Municipal",
      email: "admin@prefeitura.local",
      perfil: "admin",
    },
    exportedAt: "2026-06-06T00:00:00.000Z",
  });

  const backup = JSON.parse(json) as {
    schemaVersion: number;
    exportedAt: string;
    exportedBy: { id: string; perfil: string };
    counts: { postes: number; ordens: number; denuncias: number; auditLogs: number; syncQueue: number };
    data: { postes: unknown[]; ordens: unknown[]; denuncias: unknown[] };
  };

  assert.equal(backup.schemaVersion, 1);
  assert.equal(backup.exportedAt, "2026-06-06T00:00:00.000Z");
  assert.equal(backup.exportedBy.id, "usr-admin");
  assert.equal(backup.exportedBy.perfil, "admin");
  assert.equal(backup.counts.postes, mockPostes.length);
  assert.equal(backup.counts.ordens, mockOrdens.length);
  assert.equal(backup.counts.denuncias, mockDenuncias.length);
  assert.equal(backup.counts.auditLogs, 0);
  assert.equal(backup.counts.syncQueue, 0);
  assert.equal(backup.data.postes.length, mockPostes.length);
});

test("parses a valid local backup for restore", () => {
  const backup = parseLocalBackupJson(
    buildLocalBackupJson({
      postes: mockPostes,
      ordens: mockOrdens,
      denuncias: mockDenuncias,
      auditLogs: [],
      syncQueue: [],
      currentUser: null,
      exportedAt: "2026-06-06T00:00:00.000Z",
    }),
  );

  assert.equal(backup.schemaVersion, 1);
  assert.equal(backup.data.postes[0].codigo, mockPostes[0].codigo);
});

test("rejects malformed or unsupported local backups", () => {
  assert.throws(() => parseLocalBackupJson("{"), /JSON nao pode ser lido/);
  assert.throws(() => parseLocalBackupJson(JSON.stringify({ schemaVersion: 99, data: {} })), /schema nao suportada/);
  assert.throws(() => parseLocalBackupJson(JSON.stringify({ schemaVersion: 1, data: { postes: [] } })), /listas obrigatorias/);
});
