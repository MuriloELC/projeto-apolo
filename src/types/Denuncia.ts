export type DenunciaStatus = "recebida" | "em_analise" | "convertida_os" | "resolvida";
export type DenunciaTipo = "luminaria_apagada" | "oscilando" | "poste_danificado" | "fio_exposto" | "outro";

export type Denuncia = {
  id: string;
  codigo: string;
  posteId?: string;
  tipo: DenunciaTipo;
  status: DenunciaStatus;
  descricao: string;
  enderecoReferencia: string;
  bairro: string;
  latitude?: number;
  longitude?: number;
  fotoUri?: string;
  criadaPorId: string;
  criadaPorNome: string;
  dataAbertura: string;
  dataAtualizacao: string;
};

