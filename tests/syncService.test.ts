import assert from "node:assert/strict";
import test from "node:test";
import { buildSyncBatchRequest, retryFailedSyncItems, simulateSyncBatch } from "../src/services/syncService";
import type { SyncQueueItem } from "../src/types/Auditoria";

const baseItem: SyncQueueItem = {
  id: "sync-1",
  idempotencyKey: "poste:1:update:test",
  operation: "update",
  entity: "poste",
  entityId: "1",
  entityCode: "PB-0001",
  actorId: "usr-admin",
  actorRole: "admin",
  payloadSnapshot: { id: "1", codigo: "PB-0001" },
  status: "pending",
  createdAt: "2026-06-06T00:00:00.000Z",
  attempts: 0,
};

test("builds a sync batch with only pending operations", () => {
  const request = buildSyncBatchRequest(
    [
      baseItem,
      {
        ...baseItem,
        id: "sync-2",
        status: "synced",
      },
    ],
    "device-test",
  );

  assert.equal(request.deviceId, "device-test");
  assert.equal(request.operations.length, 1);
  assert.equal(request.operations[0].idempotencyKey, "poste:1:update:test");
});

test("simulates successful and failed sync operations", async () => {
  const response = await simulateSyncBatch({
    deviceId: "device-test",
    generatedAt: "2026-06-06T00:00:00.000Z",
    operations: [
      {
        id: "sync-ok",
        idempotencyKey: "ok",
        entity: "poste",
        operation: "update",
        entityId: "1",
        actorId: "usr-admin",
        actorRole: "admin",
        payload: { id: "1" },
        createdAt: "2026-06-06T00:00:00.000Z",
      },
      {
        id: "sync-fail",
        idempotencyKey: "fail",
        entity: "poste",
        operation: "update",
        entityId: "2",
        actorId: "usr-admin",
        actorRole: "admin",
        payload: null,
        createdAt: "2026-06-06T00:00:00.000Z",
      },
    ],
  });

  assert.equal(response.results[0].status, "synced");
  assert.equal(response.results[1].status, "failed");
});

test("moves failed sync items back to pending for retry", () => {
  const retriedItems = retryFailedSyncItems([
    {
      ...baseItem,
      id: "sync-failed",
      status: "failed",
      lastError: "Payload ausente",
      remoteVersion: 10,
      attempts: 2,
    },
    {
      ...baseItem,
      id: "sync-synced",
      status: "synced",
      remoteVersion: 11,
      attempts: 1,
    },
  ]);

  assert.equal(retriedItems[0].status, "pending");
  assert.equal(retriedItems[0].lastError, undefined);
  assert.equal(retriedItems[0].remoteVersion, undefined);
  assert.equal(retriedItems[0].attempts, 2);
  assert.equal(retriedItems[1].status, "synced");
});
