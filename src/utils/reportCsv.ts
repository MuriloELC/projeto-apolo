import type { Denuncia } from "../types/Denuncia";
import type { OrdemServico } from "../types/OrdemServico";
import type { Poste } from "../types/Poste";

const separator = ";";

function cell(value: string | number | undefined | null) {
  const text = value === undefined || value === null ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

function row(values: Array<string | number | undefined | null>) {
  return values.map(cell).join(separator);
}

export function buildPostesCsv(postes: Poste[]) {
  const headers = [
    "codigo",
    "patrimonioId",
    "bairro",
    "status",
    "latitude",
    "longitude",
    "enderecoReferencia",
    "tipoPoste",
    "alturaMetros",
    "circuito",
    "transformadorReferencia",
    "luminariaTipo",
    "potencia",
    "marca",
    "modelo",
    "especificacao",
    "produtoId",
    "numeroSerie",
    "numeroLicitacao",
    "dataCompra",
    "dataInstalacao",
    "fornecedor",
    "garantiaMeses",
    "estadoLuminaria",
    "bracoTipo",
    "bracoMaterial",
    "bracoEstado",
    "cadastradoPor",
    "dataCadastro",
    "atualizadoPor",
    "dataAtualizacao",
  ];

  return [
    row(headers),
    ...postes.map((poste) =>
      row([
        poste.codigo,
        poste.patrimonioId,
        poste.bairro,
        poste.status,
        poste.latitude,
        poste.longitude,
        poste.enderecoReferencia,
        poste.tipoPoste,
        poste.alturaMetros,
        poste.circuito,
        poste.transformadorReferencia,
        poste.luminaria.tipo,
        poste.luminaria.potencia,
        poste.luminaria.marca,
        poste.luminaria.modelo,
        poste.luminaria.especificacao,
        poste.luminaria.produtoId,
        poste.luminaria.numeroSerie,
        poste.luminaria.numeroLicitacao,
        poste.luminaria.dataCompra,
        poste.luminaria.dataInstalacao,
        poste.luminaria.fornecedor,
        poste.luminaria.garantiaMeses,
        poste.luminaria.estado,
        poste.braco.tipo,
        poste.braco.material,
        poste.braco.estado,
        poste.cadastradoPor,
        poste.dataCadastro,
        poste.atualizadoPor,
        poste.dataAtualizacao,
      ]),
    ),
  ].join("\n");
}

export function buildOrdensCsv(ordens: OrdemServico[]) {
  const headers = [
    "codigo",
    "posteId",
    "tipo",
    "prioridade",
    "status",
    "origem",
    "denunciaId",
    "denunciaCodigo",
    "solicitante",
    "dataAbertura",
    "dataAtualizacao",
    "atualizadaPor",
    "dataConclusao",
    "concluidaPor",
    "criadaPor",
    "descricao",
  ];

  return [
    row(headers),
    ...ordens.map((ordem) =>
      row([
        ordem.codigo,
        ordem.posteId,
        ordem.tipo,
        ordem.prioridade,
        ordem.status,
        ordem.origem,
        ordem.denunciaId,
        ordem.denunciaCodigo,
        ordem.solicitante,
        ordem.dataAbertura,
        ordem.dataAtualizacao,
        ordem.atualizadaPor,
        ordem.dataConclusao,
        ordem.concluidaPor,
        ordem.criadaPor,
        ordem.descricao,
      ]),
    ),
  ].join("\n");
}

export function buildDenunciasCsv(denuncias: Denuncia[]) {
  const headers = [
    "codigo",
    "posteId",
    "tipo",
    "status",
    "bairro",
    "enderecoReferencia",
    "latitude",
    "longitude",
    "criadaPorNome",
    "dataAbertura",
    "dataAtualizacao",
    "descricao",
  ];

  return [
    row(headers),
    ...denuncias.map((denuncia) =>
      row([
        denuncia.codigo,
        denuncia.posteId,
        denuncia.tipo,
        denuncia.status,
        denuncia.bairro,
        denuncia.enderecoReferencia,
        denuncia.latitude,
        denuncia.longitude,
        denuncia.criadaPorNome,
        denuncia.dataAbertura,
        denuncia.dataAtualizacao,
        denuncia.descricao,
      ]),
    ),
  ].join("\n");
}
