import type { AuditLog, SyncQueueItem } from "../types/Auditoria";
import type { Denuncia } from "../types/Denuncia";
import type { OrdemServico } from "../types/OrdemServico";
import type { Poste } from "../types/Poste";
import type { Usuario } from "../types/Usuario";

export type LocalBackupInput = {
  postes: Poste[];
  ordens: OrdemServico[];
  denuncias: Denuncia[];
  auditLogs: AuditLog[];
  syncQueue: SyncQueueItem[];
  currentUser: Usuario | null;
  exportedAt?: string;
};

export type LocalBackupPayload = {
  schemaVersion: 1;
  exportedAt: string;
  exportedBy: Pick<Usuario, "id" | "nome" | "email" | "perfil"> | null;
  counts: {
    postes: number;
    ordens: number;
    denuncias: number;
    auditLogs: number;
    syncQueue: number;
  };
  data: {
    postes: Poste[];
    ordens: OrdemServico[];
    denuncias: Denuncia[];
    auditLogs: AuditLog[];
    syncQueue: SyncQueueItem[];
  };
};

export function buildLocalBackupJson({
  postes,
  ordens,
  denuncias,
  auditLogs,
  syncQueue,
  currentUser,
  exportedAt = new Date().toISOString(),
}: LocalBackupInput) {
  return JSON.stringify(
    {
      schemaVersion: 1,
      exportedAt,
      exportedBy: currentUser
        ? {
            id: currentUser.id,
            nome: currentUser.nome,
            email: currentUser.email,
            perfil: currentUser.perfil,
          }
        : null,
      counts: {
        postes: postes.length,
        ordens: ordens.length,
        denuncias: denuncias.length,
        auditLogs: auditLogs.length,
        syncQueue: syncQueue.length,
      },
      data: {
        postes,
        ordens,
        denuncias,
        auditLogs,
        syncQueue,
      },
    },
    null,
    2,
  );
}

export function parseLocalBackupJson(jsonText: string): LocalBackupPayload {
  let parsed: unknown;

  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error("Backup invalido: JSON nao pode ser lido.");
  }

  if (!isRecord(parsed)) {
    throw new Error("Backup invalido: estrutura raiz ausente.");
  }

  if (parsed.schemaVersion !== 1) {
    throw new Error("Backup invalido: versao de schema nao suportada.");
  }

  if (!isRecord(parsed.data)) {
    throw new Error("Backup invalido: bloco de dados ausente.");
  }

  const data = parsed.data;
  if (
    !Array.isArray(data.postes) ||
    !Array.isArray(data.ordens) ||
    !Array.isArray(data.denuncias) ||
    !Array.isArray(data.auditLogs) ||
    !Array.isArray(data.syncQueue)
  ) {
    throw new Error("Backup invalido: listas obrigatorias ausentes.");
  }

  return parsed as LocalBackupPayload;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
