import { DenunciaTipo } from "../types/Denuncia";
import { OrdemTipo } from "../types/OrdemServico";

export function labelFromValue(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function ordemTipoLabel(tipo: OrdemTipo) {
  const labels: Record<OrdemTipo, string> = {
    troca_lampada: "Troca de lâmpada",
    manutencao: "Manutenção",
    vistoria: "Vistoria",
    instalacao: "Instalação",
  };

  return labels[tipo];
}

export function denunciaTipoLabel(tipo: DenunciaTipo) {
  const labels: Record<DenunciaTipo, string> = {
    luminaria_apagada: "Luminária apagada",
    oscilando: "Luminária oscilando",
    poste_danificado: "Poste danificado",
    fio_exposto: "Fio exposto",
    outro: "Outro",
  };

  return labels[tipo];
}
