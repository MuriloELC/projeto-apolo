import type { SyncQueueItem } from "../types/Auditoria";

export type SyncBatchRequest = {
  deviceId: string;
  generatedAt: string;
  operations: Array<{
    id: string;
    idempotencyKey: string;
    entity: SyncQueueItem["entity"];
    operation: SyncQueueItem["operation"];
    entityId: string;
    actorId: string;
    actorRole: string;
    payload: unknown;
    createdAt: string;
  }>;
};

export type SyncOperationResult = {
  id: string;
  status: "synced" | "failed";
  remoteVersion?: number;
  error?: string;
};

export type SyncBatchResponse = {
  acceptedAt: string;
  results: SyncOperationResult[];
};

export function buildSyncBatchRequest(items: SyncQueueItem[], deviceId: string): SyncBatchRequest {
  return {
    deviceId,
    generatedAt: new Date().toISOString(),
    operations: items
      .filter((item) => item.status === "pending")
      .map((item) => ({
        id: item.id,
        idempotencyKey: item.idempotencyKey,
        entity: item.entity,
        operation: item.operation,
        entityId: item.entityId,
        actorId: item.actorId,
        actorRole: item.actorRole,
        payload: item.payloadSnapshot,
        createdAt: item.createdAt,
      })),
  };
}

export function retryFailedSyncItems(items: SyncQueueItem[]) {
  return items.map((item) =>
    item.status === "failed"
      ? {
          ...item,
          status: "pending" as const,
          lastError: undefined,
          remoteVersion: undefined,
        }
      : item,
  );
}

export async function simulateSyncBatch(request: SyncBatchRequest): Promise<SyncBatchResponse> {
  return {
    acceptedAt: new Date().toISOString(),
    results: request.operations.map((operation, index) => {
      if (!operation.payload) {
        return {
          id: operation.id,
          status: "failed",
          error: "Payload ausente para sincronizacao.",
        };
      }

      return {
        id: operation.id,
        status: "synced",
        remoteVersion: index + 1,
      };
    }),
  };
}
