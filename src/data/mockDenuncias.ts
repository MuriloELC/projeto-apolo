import { Denuncia } from "../types/Denuncia";

export const mockDenuncias: Denuncia[] = [
  {
    id: "den-1",
    codigo: "DEN-0001",
    posteId: "2",
    tipo: "luminaria_apagada",
    status: "em_analise",
    descricao: "Luminária apagada há três noites na esquina.",
    enderecoReferencia: "Rua Guaporé, esquina com Rua Rondônia",
    bairro: "Jardim das Oliveiras",
    latitude: -11.6754,
    longitude: -61.1982,
    criadaPorId: "usr-cidadao",
    criadaPorNome: "Cidadão",
    dataAbertura: "2026-05-10",
    dataAtualizacao: "2026-05-11",
  },
];

