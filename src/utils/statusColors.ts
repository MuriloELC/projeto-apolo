import { DenunciaStatus } from "../types/Denuncia";
import { LuminariaEstado, PosteStatus } from "../types/Poste";
import { OrdemPrioridade, OrdemStatus } from "../types/OrdemServico";

export const colors = {
  background: "#f4f7f8",
  surface: "#ffffff",
  text: "#172026",
  muted: "#60717a",
  border: "#d9e2e7",
  primary: "#0f766e",
  primaryDark: "#115e59",
  success: "#16803c",
  warning: "#b7791f",
  danger: "#ba1a1a",
  inactive: "#737373",
  blue: "#1d4ed8",
};

export function getPosteStatusColor(status: PosteStatus) {
  return {
    ativo: colors.success,
    manutencao: colors.warning,
    inativo: colors.inactive,
  }[status];
}

export function getLuminariaEstadoColor(estado: LuminariaEstado) {
  return {
    funcionando: colors.success,
    queimada: colors.danger,
    oscilando: colors.warning,
    danificada: colors.danger,
  }[estado];
}

export function getMapPinColor(status: PosteStatus, estado: LuminariaEstado) {
  if (status === "inativo") return colors.inactive;
  if (estado === "queimada" || estado === "danificada") return colors.danger;
  if (status === "manutencao" || estado === "oscilando") return colors.warning;
  return colors.success;
}

export function getOrdemStatusColor(status: OrdemStatus) {
  return {
    aberta: colors.danger,
    em_andamento: colors.warning,
    concluida: colors.success,
  }[status];
}

export function getPrioridadeColor(prioridade: OrdemPrioridade) {
  return {
    baixa: colors.blue,
    media: colors.warning,
    alta: colors.danger,
  }[prioridade];
}

export function getDenunciaStatusColor(status: DenunciaStatus) {
  return {
    recebida: colors.blue,
    em_analise: colors.warning,
    convertida_os: colors.primary,
    resolvida: colors.success,
  }[status];
}
