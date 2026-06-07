export type AuditAction =
  | "poste_criado"
  | "poste_atualizado"
  | "ordem_criada"
  | "ordem_status_atualizado"
  | "denuncia_criada"
  | "denuncia_status_atualizado"
  | "manutencao_registrada"
  | "backup_restaurado";

export type AuditEntity = "poste" | "ordem" | "denuncia" | "manutencao" | "sistema";

export type AuditLog = {
  id: string;
  action: AuditAction;
  entity: AuditEntity;
  entityId: string;
  entityCode?: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  timestamp: string;
  summary: string;
};

export type SyncOperation = "create" | "update";
export type SyncStatus = "pending" | "synced" | "failed";

export type SyncQueueItem = {
  id: string;
  idempotencyKey: string;
  operation: SyncOperation;
  entity: AuditEntity;
  entityId: string;
  entityCode?: string;
  actorId: string;
  actorRole: string;
  payloadSnapshot: unknown;
  status: SyncStatus;
  createdAt: string;
  lastAttemptAt?: string;
  lastError?: string;
  remoteVersion?: number;
  attempts: number;
};
