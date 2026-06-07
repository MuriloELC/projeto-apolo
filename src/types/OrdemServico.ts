export type OrdemTipo = "troca_lampada" | "manutencao" | "vistoria" | "instalacao";
export type OrdemPrioridade = "baixa" | "media" | "alta";
export type OrdemStatus = "aberta" | "em_andamento" | "concluida";
export type OrdemOrigem = "manual" | "denuncia";

export type OrdemServico = {
  id: string;
  codigo: string;
  posteId: string;
  origem: OrdemOrigem;
  denunciaId?: string;
  denunciaCodigo?: string;
  solicitante?: string;
  tipo: OrdemTipo;
  prioridade: OrdemPrioridade;
  status: OrdemStatus;
  descricao: string;
  dataAbertura: string;
  dataAtualizacao: string;
  atualizadaPor: string;
  dataConclusao?: string;
  concluidaPor?: string;
  fotoUri?: string;
  criadaPor: string;
};
