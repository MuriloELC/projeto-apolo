import type { OrdemServico } from "../types/OrdemServico";
import type { Manutencao, Poste } from "../types/Poste";

export function buildManutencaoFromConcludedOrdem(ordem: OrdemServico, responsavel: string, data: string): Manutencao {
  return {
    id: `mnt-${ordem.id}-${data}`,
    data,
    responsavel,
    descricao: `OS ${ordem.codigo} concluida: ${ordem.descricao}`,
  };
}

export function applyConcludedOrdemToPostes(postes: Poste[], ordem: OrdemServico, manutencao: Manutencao) {
  return postes.map((poste) => {
    if (poste.id !== ordem.posteId) return poste;

    const alreadyRegistered = poste.historicoManutencoes.some((item) => item.id === manutencao.id);
    if (alreadyRegistered) return poste;

    return {
      ...poste,
      historicoManutencoes: [manutencao, ...poste.historicoManutencoes],
      dataAtualizacao: manutencao.data,
      atualizadoPor: manutencao.responsavel,
    };
  });
}
