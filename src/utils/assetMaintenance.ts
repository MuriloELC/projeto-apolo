import type { Manutencao, ManutencaoAssetUpdates, Poste } from "../types/Poste";

export function applyManutencaoToPostes(
  postes: Poste[],
  posteId: string,
  manutencao: Manutencao,
  updates: ManutencaoAssetUpdates = {},
) {
  return postes.map((poste) => {
    if (poste.id !== posteId) return poste;

    return {
      ...poste,
      status: updates.status ?? poste.status,
      dataAtualizacao: manutencao.data,
      atualizadoPor: manutencao.responsavel,
      luminaria: {
        ...poste.luminaria,
        estado: updates.luminariaEstado ?? poste.luminaria.estado,
      },
      braco: {
        ...poste.braco,
        estado: updates.bracoEstado ?? poste.braco.estado,
      },
      historicoManutencoes: [manutencao, ...poste.historicoManutencoes],
    };
  });
}
