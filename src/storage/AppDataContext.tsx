import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { mockDenuncias } from "../data/mockDenuncias";
import { mockOrdens } from "../data/mockOrdens";
import { mockPostes } from "../data/mockPostes";
import { mockUsers } from "../data/mockUsers";
import { buildSyncBatchRequest, retryFailedSyncItems, simulateSyncBatch } from "../services/syncService";
import { AuditAction, AuditEntity, AuditLog, SyncOperation, SyncQueueItem } from "../types/Auditoria";
import { Denuncia, DenunciaStatus } from "../types/Denuncia";
import { OrdemServico, OrdemStatus } from "../types/OrdemServico";
import { Manutencao, ManutencaoAssetUpdates, Poste } from "../types/Poste";
import { Usuario, canControlSystem, canManageAssets } from "../types/Usuario";
import {
  assertExistingDenuncia,
  assertExistingOrdem,
  assertValidDenuncia,
  assertValidManutencao,
  assertValidOrdem,
  assertValidPoste,
} from "../utils/domainValidation";
import { applyManutencaoToPostes } from "../utils/assetMaintenance";
import { parseLocalBackupJson } from "../utils/localBackup";
import { applyConcludedOrdemToPostes, buildManutencaoFromConcludedOrdem } from "../utils/maintenanceFromOrder";
import { hashPassword } from "../utils/security";

type AppDataContextValue = {
  postes: Poste[];
  ordens: OrdemServico[];
  denuncias: Denuncia[];
  auditLogs: AuditLog[];
  syncQueue: SyncQueueItem[];
  currentUser: Usuario | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
  savePoste: (poste: Poste) => Promise<void>;
  saveOrdem: (ordem: OrdemServico) => Promise<void>;
  saveDenuncia: (denuncia: Denuncia) => Promise<void>;
  updateOrdemStatus: (ordemId: string, status: OrdemStatus) => Promise<void>;
  updateDenunciaStatus: (denunciaId: string, status: DenunciaStatus) => Promise<void>;
  addManutencao: (posteId: string, manutencao: Manutencao, updates?: ManutencaoAssetUpdates) => Promise<void>;
  markSyncQueueAsSynced: () => Promise<void>;
  retryFailedSyncQueue: () => Promise<void>;
  restoreLocalBackupFromJson: (backupJson: string) => Promise<void>;
};

const POSTES_KEY = "@luminarias/postes";
const ORDENS_KEY = "@luminarias/ordens";
const DENUNCIAS_KEY = "@luminarias/denuncias";
const AUDIT_LOGS_KEY = "@luminarias/audit-logs";
const SYNC_QUEUE_KEY = "@luminarias/sync-queue";
const SESSION_USER_ID_KEY = "@luminarias/session-user-id";
const LOGIN_ATTEMPTS_KEY = "@luminarias/login-attempts";
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_LOCK_MS = 30_000;

type LoginAttemptState = {
  failures: number;
  lockedUntil?: string;
};

type LoginResult =
  | { ok: true }
  | {
      ok: false;
      reason: "invalid_credentials" | "locked";
      lockedUntil?: string;
    };

type LocalOperationParams = {
  action: AuditAction;
  entity: AuditEntity;
  entityId: string;
  entityCode?: string;
  operation: SyncOperation;
  payloadSnapshot: unknown;
  summary: string;
};

function publicUser(userId: string): Usuario | null {
  const user = mockUsers.find((item) => item.id === userId);
  if (!user) return null;

  return {
    id: user.id,
    nome: user.nome,
    email: user.email,
    perfil: user.perfil,
  };
}

function normalizePostes(rawPostes: Poste[]) {
  return rawPostes.map((poste) => ({
    ...poste,
    patrimonioId: poste.patrimonioId ?? `PAT-${poste.codigo}`,
    alturaMetros: poste.alturaMetros ?? 9,
    circuito: poste.circuito ?? "Nao informado",
    transformadorReferencia: poste.transformadorReferencia ?? "Nao informado",
    luminaria: {
      ...poste.luminaria,
      especificacao: poste.luminaria.especificacao ?? "Nao informado",
      produtoId: poste.luminaria.produtoId ?? "Nao informado",
      numeroLicitacao: poste.luminaria.numeroLicitacao ?? "Nao informado",
      dataCompra: poste.luminaria.dataCompra ?? poste.luminaria.dataInstalacao,
      fornecedor: poste.luminaria.fornecedor ?? "Nao informado",
      garantiaMeses: poste.luminaria.garantiaMeses ?? 0,
    },
  }));
}

function normalizeOrdens(rawOrdens: OrdemServico[]) {
  return rawOrdens.map((ordem) => ({
    ...ordem,
    origem: ordem.origem ?? "manual",
    dataAtualizacao: ordem.dataAtualizacao ?? ordem.dataConclusao ?? ordem.dataAbertura,
    atualizadaPor: ordem.atualizadaPor ?? ordem.concluidaPor ?? ordem.criadaPor,
    dataConclusao: ordem.status === "concluida" ? ordem.dataConclusao ?? ordem.dataAtualizacao ?? ordem.dataAbertura : ordem.dataConclusao,
    concluidaPor: ordem.status === "concluida" ? ordem.concluidaPor ?? ordem.atualizadaPor ?? ordem.criadaPor : ordem.concluidaPor,
  }));
}

function makeAuditLog(params: {
  action: AuditAction;
  entity: AuditEntity;
  entityId: string;
  entityCode?: string;
  actor: Usuario | null;
  summary: string;
}): AuditLog {
  const actor = params.actor ?? {
    id: "system",
    nome: "Sistema local",
    email: "system@local",
    perfil: "admin" as const,
  };

  return {
    id: `audit-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    action: params.action,
    entity: params.entity,
    entityId: params.entityId,
    entityCode: params.entityCode,
    actorId: actor.id,
    actorName: actor.nome,
    actorRole: actor.perfil,
    timestamp: new Date().toISOString(),
    summary: params.summary,
  };
}

function makeSyncQueueItem(params: {
  operation: SyncOperation;
  entity: AuditEntity;
  entityId: string;
  entityCode?: string;
  actor: Usuario | null;
  payloadSnapshot: unknown;
}): SyncQueueItem {
  const actor = params.actor ?? {
    id: "system",
    nome: "Sistema local",
    email: "system@local",
    perfil: "admin" as const,
  };
  const createdAt = new Date().toISOString();

  return {
    id: `sync-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    idempotencyKey: `${params.entity}:${params.entityId}:${params.operation}:${createdAt}`,
    operation: params.operation,
    entity: params.entity,
    entityId: params.entityId,
    entityCode: params.entityCode,
    actorId: actor.id,
    actorRole: actor.perfil,
    payloadSnapshot: params.payloadSnapshot,
    status: "pending",
    createdAt,
    attempts: 0,
  };
}

function normalizeSyncQueue(rawQueue: SyncQueueItem[]) {
  return rawQueue.map((item) => ({
    ...item,
    idempotencyKey: item.idempotencyKey ?? `${item.entity}:${item.entityId}:${item.operation}:${item.createdAt}`,
    actorId: item.actorId ?? "unknown",
    actorRole: item.actorRole ?? "unknown",
    payloadSnapshot: item.payloadSnapshot ?? null,
    attempts: item.attempts ?? 0,
  }));
}

function requireAuthenticatedUser(user: Usuario | null) {
  if (!user) {
    throw new Error("Acesso negado: sessao local expirada.");
  }
  return user;
}

function requireAssetManager(user: Usuario | null) {
  const actor = requireAuthenticatedUser(user);
  if (!canManageAssets(actor.perfil)) {
    throw new Error("Acesso negado: somente admin e funcionarios podem alterar ativos e ordens.");
  }
  return actor;
}

function requireSystemAdmin(user: Usuario | null) {
  const actor = requireAuthenticatedUser(user);
  if (!canControlSystem(actor.perfil)) {
    throw new Error("Acesso negado: somente admin pode executar esta acao.");
  }
  return actor;
}

async function getLoginAttemptState(email: string): Promise<LoginAttemptState> {
  const storedAttempts = await AsyncStorage.getItem(LOGIN_ATTEMPTS_KEY);
  const attempts = storedAttempts ? (JSON.parse(storedAttempts) as Record<string, LoginAttemptState>) : {};
  return attempts[email] ?? { failures: 0 };
}

async function setLoginAttemptState(email: string, state: LoginAttemptState) {
  const storedAttempts = await AsyncStorage.getItem(LOGIN_ATTEMPTS_KEY);
  const attempts = storedAttempts ? (JSON.parse(storedAttempts) as Record<string, LoginAttemptState>) : {};
  attempts[email] = state;
  await AsyncStorage.setItem(LOGIN_ATTEMPTS_KEY, JSON.stringify(attempts));
}

async function clearLoginAttemptState(email: string) {
  const storedAttempts = await AsyncStorage.getItem(LOGIN_ATTEMPTS_KEY);
  const attempts = storedAttempts ? (JSON.parse(storedAttempts) as Record<string, LoginAttemptState>) : {};
  delete attempts[email];
  await AsyncStorage.setItem(LOGIN_ATTEMPTS_KEY, JSON.stringify(attempts));
}

export const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [postes, setPostes] = useState<Poste[]>(mockPostes);
  const [ordens, setOrdens] = useState<OrdemServico[]>(mockOrdens);
  const [denuncias, setDenuncias] = useState<Denuncia[]>(mockDenuncias);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [syncQueue, setSyncQueue] = useState<SyncQueueItem[]>([]);
  const [currentUser, setCurrentUser] = useState<Usuario | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [storedPostes, storedOrdens, storedDenuncias, storedAuditLogs, storedSyncQueue, storedUserId] =
          await Promise.all([
            AsyncStorage.getItem(POSTES_KEY),
            AsyncStorage.getItem(ORDENS_KEY),
            AsyncStorage.getItem(DENUNCIAS_KEY),
            AsyncStorage.getItem(AUDIT_LOGS_KEY),
            AsyncStorage.getItem(SYNC_QUEUE_KEY),
            AsyncStorage.getItem(SESSION_USER_ID_KEY),
          ]);

        if (storedPostes) setPostes(normalizePostes(JSON.parse(storedPostes) as Poste[]));
        if (storedOrdens) setOrdens(normalizeOrdens(JSON.parse(storedOrdens) as OrdemServico[]));
        if (storedDenuncias) setDenuncias(JSON.parse(storedDenuncias) as Denuncia[]);
        if (storedAuditLogs) setAuditLogs(JSON.parse(storedAuditLogs) as AuditLog[]);
        if (storedSyncQueue) setSyncQueue(normalizeSyncQueue(JSON.parse(storedSyncQueue) as SyncQueueItem[]));
        if (storedUserId) setCurrentUser(publicUser(storedUserId));
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  const persistPostes = useCallback(async (nextPostes: Poste[]) => {
    setPostes(nextPostes);
    await AsyncStorage.setItem(POSTES_KEY, JSON.stringify(nextPostes));
  }, []);

  const persistOrdens = useCallback(async (nextOrdens: OrdemServico[]) => {
    setOrdens(nextOrdens);
    await AsyncStorage.setItem(ORDENS_KEY, JSON.stringify(nextOrdens));
  }, []);

  const persistDenuncias = useCallback(async (nextDenuncias: Denuncia[]) => {
    setDenuncias(nextDenuncias);
    await AsyncStorage.setItem(DENUNCIAS_KEY, JSON.stringify(nextDenuncias));
  }, []);

  const persistAuditLogs = useCallback(async (nextAuditLogs: AuditLog[]) => {
    setAuditLogs(nextAuditLogs);
    await AsyncStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(nextAuditLogs));
  }, []);

  const persistSyncQueue = useCallback(async (nextSyncQueue: SyncQueueItem[]) => {
    setSyncQueue(nextSyncQueue);
    await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(nextSyncQueue));
  }, []);

  const registerLocalOperations = useCallback(
    async (operations: LocalOperationParams[]) => {
      if (operations.length === 0) return;

      const nextAuditLogs = [
        ...operations.map((params) =>
          makeAuditLog({
            action: params.action,
            entity: params.entity,
            entityId: params.entityId,
            entityCode: params.entityCode,
            actor: currentUser,
            summary: params.summary,
          }),
        ),
        ...auditLogs,
      ].slice(0, 250);

      const nextSyncQueue = [
        ...operations.map((params) =>
          makeSyncQueueItem({
            operation: params.operation,
            entity: params.entity,
            entityId: params.entityId,
            entityCode: params.entityCode,
            actor: currentUser,
            payloadSnapshot: params.payloadSnapshot,
          }),
        ),
        ...syncQueue,
      ].slice(0, 500);

      await Promise.all([persistAuditLogs(nextAuditLogs), persistSyncQueue(nextSyncQueue)]);
    },
    [auditLogs, currentUser, persistAuditLogs, persistSyncQueue, syncQueue],
  );

  const registerLocalOperation = useCallback(
    async (params: LocalOperationParams) => {
      await registerLocalOperations([params]);
    },
    [registerLocalOperations],
  );

  const login = useCallback(async (email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    const attemptState = await getLoginAttemptState(normalizedEmail);
    const lockedUntil = attemptState.lockedUntil ? new Date(attemptState.lockedUntil) : null;

    if (lockedUntil && lockedUntil.getTime() > Date.now()) {
      return { ok: false, reason: "locked", lockedUntil: attemptState.lockedUntil } satisfies LoginResult;
    }

    const user = mockUsers.find((item) => item.email.toLowerCase() === normalizedEmail);
    if (!user) {
      const failures = attemptState.failures + 1;
      const nextState: LoginAttemptState =
        failures >= MAX_LOGIN_ATTEMPTS
          ? { failures, lockedUntil: new Date(Date.now() + LOGIN_LOCK_MS).toISOString() }
          : { failures };
      await setLoginAttemptState(normalizedEmail, nextState);
      return {
        ok: false,
        reason: nextState.lockedUntil ? "locked" : "invalid_credentials",
        lockedUntil: nextState.lockedUntil,
      } satisfies LoginResult;
    }

    const passwordHash = await hashPassword(password, user.passwordSalt, user.passwordIterations);
    if (passwordHash !== user.passwordHash) {
      const failures = attemptState.failures + 1;
      const nextState: LoginAttemptState =
        failures >= MAX_LOGIN_ATTEMPTS
          ? { failures, lockedUntil: new Date(Date.now() + LOGIN_LOCK_MS).toISOString() }
          : { failures };
      await setLoginAttemptState(normalizedEmail, nextState);
      return {
        ok: false,
        reason: nextState.lockedUntil ? "locked" : "invalid_credentials",
        lockedUntil: nextState.lockedUntil,
      } satisfies LoginResult;
    }

    const nextUser = publicUser(user.id);
    if (!nextUser) return { ok: false, reason: "invalid_credentials" } satisfies LoginResult;

    setCurrentUser(nextUser);
    await Promise.all([AsyncStorage.setItem(SESSION_USER_ID_KEY, user.id), clearLoginAttemptState(normalizedEmail)]);
    return { ok: true } satisfies LoginResult;
  }, []);

  const logout = useCallback(async () => {
    setCurrentUser(null);
    await AsyncStorage.removeItem(SESSION_USER_ID_KEY);
  }, []);

  const savePoste = useCallback(
    async (poste: Poste) => {
      requireAssetManager(currentUser);
      assertValidPoste(poste, postes);
      const exists = postes.some((item) => item.id === poste.id);
      const nextPostes = exists
        ? postes.map((item) => (item.id === poste.id ? poste : item))
        : [poste, ...postes];
      await persistPostes(nextPostes);
      await registerLocalOperation({
        action: exists ? "poste_atualizado" : "poste_criado",
        entity: "poste",
        entityId: poste.id,
        entityCode: poste.codigo,
        operation: exists ? "update" : "create",
        payloadSnapshot: poste,
        summary: `${exists ? "Atualizou" : "Criou"} o poste ${poste.codigo}`,
      });
    },
    [currentUser, persistPostes, postes, registerLocalOperation],
  );

  const saveOrdem = useCallback(
    async (ordem: OrdemServico) => {
      requireAssetManager(currentUser);
      assertValidOrdem(ordem, postes, denuncias);
      const exists = ordens.some((item) => item.id === ordem.id);
      const nextOrdens = exists
        ? ordens.map((item) => (item.id === ordem.id ? ordem : item))
        : [ordem, ...ordens];
      await persistOrdens(nextOrdens);
      await registerLocalOperation({
        action: exists ? "ordem_status_atualizado" : "ordem_criada",
        entity: "ordem",
        entityId: ordem.id,
        entityCode: ordem.codigo,
        operation: exists ? "update" : "create",
        payloadSnapshot: ordem,
        summary: `${exists ? "Atualizou" : "Criou"} a ordem ${ordem.codigo}`,
      });
    },
    [currentUser, denuncias, ordens, persistOrdens, postes, registerLocalOperation],
  );

  const saveDenuncia = useCallback(
    async (denuncia: Denuncia) => {
      const actor = requireAuthenticatedUser(currentUser);
      assertValidDenuncia(denuncia, postes);
      const exists = denuncias.some((item) => item.id === denuncia.id);
      if (exists && !canManageAssets(actor.perfil) && denuncia.criadaPorId !== actor.id) {
        throw new Error("Acesso negado: cidadao so pode alterar a propria denuncia.");
      }
      const nextDenuncias = exists
        ? denuncias.map((item) => (item.id === denuncia.id ? denuncia : item))
        : [denuncia, ...denuncias];
      await persistDenuncias(nextDenuncias);
      await registerLocalOperation({
        action: exists ? "denuncia_status_atualizado" : "denuncia_criada",
        entity: "denuncia",
        entityId: denuncia.id,
        entityCode: denuncia.codigo,
        operation: exists ? "update" : "create",
        payloadSnapshot: denuncia,
        summary: `${exists ? "Atualizou" : "Criou"} a denúncia ${denuncia.codigo}`,
      });
    },
    [currentUser, denuncias, persistDenuncias, postes, registerLocalOperation],
  );

  const updateOrdemStatus = useCallback(
    async (ordemId: string, status: OrdemStatus) => {
      const actor = requireAssetManager(currentUser);
      assertExistingOrdem(ordemId, ordens);
      const ordem = ordens.find((item) => item.id === ordemId);
      if (!ordem) return;

      const today = new Date().toISOString().slice(0, 10);
      const updatedOrdem = {
        ...ordem,
        status,
        dataAtualizacao: today,
        atualizadaPor: actor.nome,
        dataConclusao: status === "concluida" ? ordem.dataConclusao ?? today : ordem.dataConclusao,
        concluidaPor: status === "concluida" ? ordem.concluidaPor ?? actor.nome : ordem.concluidaPor,
      };
      const nextOrdens = ordens.map((item) => (item.id === ordemId ? updatedOrdem : item));
      const operations: LocalOperationParams[] = [
        {
          action: "ordem_status_atualizado",
          entity: "ordem",
          entityId: updatedOrdem.id,
          entityCode: updatedOrdem.codigo,
          operation: "update",
          payloadSnapshot: updatedOrdem,
          summary: `Alterou a ordem ${updatedOrdem.codigo} para ${status}`,
        },
      ];

      if (status === "concluida" && ordem.status !== "concluida") {
        const manutencao = buildManutencaoFromConcludedOrdem(updatedOrdem, actor.nome, today);
        assertValidManutencao(updatedOrdem.posteId, manutencao, postes);
        const nextPostes = applyConcludedOrdemToPostes(postes, updatedOrdem, manutencao);

        await persistPostes(nextPostes);
        operations.push({
          action: "manutencao_registrada",
          entity: "manutencao",
          entityId: manutencao.id,
          entityCode: postes.find((poste) => poste.id === updatedOrdem.posteId)?.codigo,
          operation: "create",
          payloadSnapshot: { posteId: updatedOrdem.posteId, manutencao, ordemId: updatedOrdem.id },
          summary: `Registrou manutencao pela conclusao da OS ${updatedOrdem.codigo}`,
        });
      }

      await persistOrdens(nextOrdens);
      await registerLocalOperations(operations);
    },
    [currentUser, ordens, persistOrdens, persistPostes, postes, registerLocalOperations],
  );

  const updateDenunciaStatus = useCallback(
    async (denunciaId: string, status: DenunciaStatus) => {
      requireAssetManager(currentUser);
      assertExistingDenuncia(denunciaId, denuncias);
      const today = new Date().toISOString().slice(0, 10);
      const denuncia = denuncias.find((item) => item.id === denunciaId);
      const updatedDenuncia = denuncia ? { ...denuncia, status, dataAtualizacao: today } : undefined;
      await persistDenuncias(
        denuncias.map((item) => (item.id === denunciaId ? { ...item, status, dataAtualizacao: today } : item)),
      );
      if (updatedDenuncia) {
        await registerLocalOperation({
          action: "denuncia_status_atualizado",
          entity: "denuncia",
          entityId: updatedDenuncia.id,
          entityCode: updatedDenuncia.codigo,
          operation: "update",
          payloadSnapshot: updatedDenuncia,
          summary: `Alterou a denúncia ${updatedDenuncia.codigo} para ${status}`,
        });
      }
    },
    [currentUser, denuncias, persistDenuncias, registerLocalOperation],
  );

  const addManutencao = useCallback(
    async (posteId: string, manutencao: Manutencao, updates: ManutencaoAssetUpdates = {}) => {
      requireAssetManager(currentUser);
      assertValidManutencao(posteId, manutencao, postes);
      const poste = postes.find((item) => item.id === posteId);
      const nextPostes = applyManutencaoToPostes(postes, posteId, manutencao, updates);
      await persistPostes(nextPostes);
      await registerLocalOperation({
        action: "manutencao_registrada",
        entity: "manutencao",
        entityId: manutencao.id,
        entityCode: poste?.codigo,
        operation: "create",
        payloadSnapshot: { posteId, manutencao, updates },
        summary: `Registrou manutenção no poste ${poste?.codigo ?? posteId}`,
      });
    },
    [currentUser, persistPostes, postes, registerLocalOperation],
  );

  const markSyncQueueAsSynced = useCallback(async () => {
    requireSystemAdmin(currentUser);
    const pendingItems = syncQueue.filter((item) => item.status === "pending");
    if (pendingItems.length === 0) return;

    const request = buildSyncBatchRequest(pendingItems, "local-device-demo");
    const response = await simulateSyncBatch(request);
    const resultsById = new Map(response.results.map((result) => [result.id, result]));

    await persistSyncQueue(
      syncQueue.map((item) =>
        item.status === "pending" && resultsById.has(item.id)
          ? {
              ...item,
              status: resultsById.get(item.id)?.status ?? "failed",
              lastAttemptAt: response.acceptedAt,
              lastError: resultsById.get(item.id)?.error,
              remoteVersion: resultsById.get(item.id)?.remoteVersion,
              attempts: item.attempts + 1,
            }
          : item,
      ),
    );
  }, [currentUser, persistSyncQueue, syncQueue]);

  const retryFailedSyncQueue = useCallback(async () => {
    requireSystemAdmin(currentUser);
    const failedItems = syncQueue.filter((item) => item.status === "failed");
    if (failedItems.length === 0) return;

    await persistSyncQueue(retryFailedSyncItems(syncQueue));
  }, [currentUser, persistSyncQueue, syncQueue]);

  const restoreLocalBackupFromJson = useCallback(
    async (backupJson: string) => {
      const actor = requireSystemAdmin(currentUser);
      const backup = parseLocalBackupJson(backupJson);
      const restoredPostes = normalizePostes(backup.data.postes);
      const restoredOrdens = normalizeOrdens(backup.data.ordens);
      const restoredDenuncias = backup.data.denuncias;
      const restoredSyncQueue = normalizeSyncQueue(backup.data.syncQueue);
      const restoreLog = makeAuditLog({
        action: "backup_restaurado",
        entity: "sistema",
        entityId: `backup-${Date.now()}`,
        actor,
        summary: `Restaurou backup local exportado em ${backup.exportedAt}`,
      });
      const restoredAuditLogs = [restoreLog, ...backup.data.auditLogs].slice(0, 250);

      await Promise.all([
        persistPostes(restoredPostes),
        persistOrdens(restoredOrdens),
        persistDenuncias(restoredDenuncias),
        persistAuditLogs(restoredAuditLogs),
        persistSyncQueue(restoredSyncQueue),
      ]);
    },
    [currentUser, persistAuditLogs, persistDenuncias, persistOrdens, persistPostes, persistSyncQueue],
  );

  const value = useMemo(
    () => ({
      postes,
      ordens,
      denuncias,
      auditLogs,
      syncQueue,
      currentUser,
      isAuthenticated: currentUser !== null,
      isLoading,
      login,
      logout,
      savePoste,
      saveOrdem,
      saveDenuncia,
      updateOrdemStatus,
      updateDenunciaStatus,
      addManutencao,
      markSyncQueueAsSynced,
      retryFailedSyncQueue,
      restoreLocalBackupFromJson,
    }),
    [
      addManutencao,
      auditLogs,
      currentUser,
      denuncias,
      isLoading,
      login,
      logout,
      markSyncQueueAsSynced,
      ordens,
      postes,
      retryFailedSyncQueue,
      restoreLocalBackupFromJson,
      saveDenuncia,
      saveOrdem,
      savePoste,
      syncQueue,
      updateDenunciaStatus,
      updateOrdemStatus,
    ],
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const context = React.useContext(AppDataContext);
  if (!context) {
    throw new Error("useAppData must be used inside AppDataProvider");
  }
  return context;
}
