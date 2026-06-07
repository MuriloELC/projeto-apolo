export type PosteStatus = "ativo" | "manutencao" | "inativo";
export type TipoPoste = "concreto" | "metalico" | "madeira" | "outro";

export type LuminariaTipo = "LED" | "Vapor de Sódio" | "Vapor Metálico";
export type LuminariaEstado = "funcionando" | "queimada" | "oscilando" | "danificada";

export type BracoTipo = "curto" | "medio" | "longo";
export type BracoMaterial = "aco" | "aluminio" | "outro";
export type BracoEstado = "bom" | "danificado" | "necessita troca";

export type Luminaria = {
  id: string;
  posteId: string;
  tipo: LuminariaTipo;
  potencia: number;
  marca: string;
  modelo: string;
  especificacao: string;
  produtoId: string;
  numeroSerie?: string;
  numeroLicitacao: string;
  dataCompra: string;
  dataInstalacao: string;
  fornecedor: string;
  garantiaMeses: number;
  estado: LuminariaEstado;
};

export type Braco = {
  id: string;
  posteId: string;
  tipo: BracoTipo;
  material: BracoMaterial;
  estado: BracoEstado;
};

export type Manutencao = {
  id: string;
  descricao: string;
  data: string;
  responsavel: string;
};

export type ManutencaoAssetUpdates = {
  status?: PosteStatus;
  luminariaEstado?: LuminariaEstado;
  bracoEstado?: BracoEstado;
};

export type Poste = {
  id: string;
  codigo: string;
  patrimonioId: string;
  latitude: number;
  longitude: number;
  enderecoReferencia: string;
  bairro: string;
  status: PosteStatus;
  tipoPoste: TipoPoste;
  alturaMetros: number;
  circuito: string;
  transformadorReferencia: string;
  dataCadastro: string;
  cadastradoPor: string;
  dataAtualizacao: string;
  atualizadoPor: string;
  fotoUri?: string;
  luminaria: Luminaria;
  braco: Braco;
  historicoManutencoes: Manutencao[];
};
