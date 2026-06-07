import { Denuncia } from "../types/Denuncia";
import { OrdemServico } from "../types/OrdemServico";
import { Manutencao, Poste } from "../types/Poste";

export class DomainValidationError extends Error {
  issues: string[];

  constructor(issues: string[]) {
    super(issues.join("\n"));
    this.name = "DomainValidationError";
    this.issues = issues;
  }
}

function isBlank(value: string | undefined | null) {
  return !value || value.trim().length === 0 || value.toLowerCase().includes("informado");
}

function isValidDate(value: string) {
  const parsed = new Date(value);
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(parsed.getTime());
}

function isValidLatitude(value: number | undefined) {
  return typeof value === "number" && Number.isFinite(value) && value >= -90 && value <= 90;
}

function isValidLongitude(value: number | undefined) {
  return typeof value === "number" && Number.isFinite(value) && value >= -180 && value <= 180;
}

function duplicateBy<T>(items: T[], predicate: (item: T) => boolean) {
  return items.some(predicate);
}

export function assertValidPoste(poste: Poste, existingPostes: Poste[]) {
  const issues: string[] = [];
  const otherPostes = existingPostes.filter((item) => item.id !== poste.id);

  if (isBlank(poste.codigo)) issues.push("Codigo do poste e obrigatorio.");
  if (isBlank(poste.patrimonioId)) issues.push("ID patrimonial e obrigatorio.");
  if (isBlank(poste.bairro)) issues.push("Bairro e obrigatorio.");
  if (isBlank(poste.enderecoReferencia)) issues.push("Endereco/referencia e obrigatorio.");
  if (!isValidLatitude(poste.latitude)) issues.push("Latitude deve estar entre -90 e 90.");
  if (!isValidLongitude(poste.longitude)) issues.push("Longitude deve estar entre -180 e 180.");
  if (!Number.isFinite(poste.alturaMetros) || poste.alturaMetros <= 0) issues.push("Altura do poste deve ser maior que zero.");
  if (isBlank(poste.circuito)) issues.push("Circuito e obrigatorio.");
  if (isBlank(poste.transformadorReferencia)) issues.push("Transformador de referencia e obrigatorio.");
  if (duplicateBy(otherPostes, (item) => item.codigo.toLowerCase() === poste.codigo.toLowerCase())) {
    issues.push("Codigo do poste ja cadastrado.");
  }
  if (duplicateBy(otherPostes, (item) => item.patrimonioId.toLowerCase() === poste.patrimonioId.toLowerCase())) {
    issues.push("ID patrimonial ja cadastrado.");
  }

  if (!Number.isFinite(poste.luminaria.potencia) || poste.luminaria.potencia <= 0) {
    issues.push("Potencia da luminaria deve ser maior que zero.");
  }
  if (isBlank(poste.luminaria.marca)) issues.push("Marca da luminaria e obrigatoria.");
  if (isBlank(poste.luminaria.modelo)) issues.push("Modelo da luminaria e obrigatorio.");
  if (isBlank(poste.luminaria.especificacao)) issues.push("Especificacao da luminaria e obrigatoria.");
  if (isBlank(poste.luminaria.produtoId)) issues.push("ID do produto e obrigatorio.");
  if (isBlank(poste.luminaria.numeroLicitacao)) issues.push("Numero da licitacao e obrigatorio.");
  if (isBlank(poste.luminaria.fornecedor)) issues.push("Fornecedor e obrigatorio.");
  if (!Number.isFinite(poste.luminaria.garantiaMeses) || poste.luminaria.garantiaMeses < 0) {
    issues.push("Garantia deve ser zero ou maior.");
  }
  if (!isValidDate(poste.luminaria.dataCompra)) issues.push("Data de compra deve estar no formato AAAA-MM-DD.");
  if (!isValidDate(poste.luminaria.dataInstalacao)) issues.push("Data de instalacao deve estar no formato AAAA-MM-DD.");
  if (
    isValidDate(poste.luminaria.dataCompra) &&
    isValidDate(poste.luminaria.dataInstalacao) &&
    new Date(poste.luminaria.dataCompra).getTime() > new Date(poste.luminaria.dataInstalacao).getTime()
  ) {
    issues.push("Data de compra nao pode ser posterior a data de instalacao.");
  }
  if (
    poste.luminaria.numeroSerie &&
    duplicateBy(otherPostes, (item) => item.luminaria.numeroSerie?.toLowerCase() === poste.luminaria.numeroSerie?.toLowerCase())
  ) {
    issues.push("Numero de serie da luminaria ja cadastrado.");
  }

  if (issues.length > 0) throw new DomainValidationError(issues);
}

export function assertValidOrdem(ordem: OrdemServico, postes: Poste[], denuncias: Denuncia[] = []) {
  const issues: string[] = [];
  const denuncia = ordem.denunciaId ? denuncias.find((item) => item.id === ordem.denunciaId) : undefined;

  if (!postes.some((poste) => poste.id === ordem.posteId)) issues.push("Ordem deve estar vinculada a um poste existente.");
  if (isBlank(ordem.codigo)) issues.push("Codigo da ordem e obrigatorio.");
  if (ordem.origem === "denuncia" && !ordem.denunciaId) {
    issues.push("Ordem originada de denuncia deve informar a denuncia vinculada.");
  }
  if (ordem.origem === "manual" && ordem.denunciaId) {
    issues.push("Ordem manual nao deve ter denuncia vinculada.");
  }
  if (ordem.denunciaId && denuncias.length > 0 && !denuncia) {
    issues.push("Denuncia vinculada a ordem nao encontrada.");
  }
  if (denuncia?.posteId && denuncia.posteId !== ordem.posteId) {
    issues.push("Poste da ordem deve ser o mesmo poste informado na denuncia.");
  }
  if (isBlank(ordem.descricao) || ordem.descricao.trim().length < 8) {
    issues.push("Descricao da ordem deve ter pelo menos 8 caracteres.");
  }
  if (!isValidDate(ordem.dataAbertura)) issues.push("Data de abertura da ordem deve estar no formato AAAA-MM-DD.");
  if (!isValidDate(ordem.dataAtualizacao)) issues.push("Data de atualizacao da ordem deve estar no formato AAAA-MM-DD.");
  if (isBlank(ordem.atualizadaPor)) issues.push("Responsavel pela ultima atualizacao da ordem e obrigatorio.");
  if (ordem.status === "concluida" && !isValidDate(ordem.dataConclusao ?? "")) {
    issues.push("Data de conclusao da ordem deve estar no formato AAAA-MM-DD.");
  }
  if (ordem.status === "concluida" && isBlank(ordem.concluidaPor)) {
    issues.push("Responsavel pela conclusao da ordem e obrigatorio.");
  }

  if (issues.length > 0) throw new DomainValidationError(issues);
}

export function assertExistingOrdem(ordemId: string, ordens: OrdemServico[]) {
  if (!ordens.some((ordem) => ordem.id === ordemId)) {
    throw new DomainValidationError(["Ordem de servico nao encontrada."]);
  }
}

export function assertValidDenuncia(denuncia: Denuncia, postes: Poste[]) {
  const issues: string[] = [];

  if (denuncia.posteId && !postes.some((poste) => poste.id === denuncia.posteId)) {
    issues.push("Denuncia esta vinculada a um poste inexistente.");
  }
  if (isBlank(denuncia.codigo)) issues.push("Codigo da denuncia e obrigatorio.");
  if (isBlank(denuncia.descricao) || denuncia.descricao.trim().length < 8) {
    issues.push("Descricao da denuncia deve ter pelo menos 8 caracteres.");
  }
  if (isBlank(denuncia.enderecoReferencia)) issues.push("Endereco/referencia da denuncia e obrigatorio.");
  if (isBlank(denuncia.bairro)) issues.push("Bairro da denuncia e obrigatorio.");
  if (denuncia.latitude !== undefined && !isValidLatitude(denuncia.latitude)) issues.push("Latitude da denuncia deve estar entre -90 e 90.");
  if (denuncia.longitude !== undefined && !isValidLongitude(denuncia.longitude)) issues.push("Longitude da denuncia deve estar entre -180 e 180.");
  if (!isValidDate(denuncia.dataAbertura)) issues.push("Data de abertura da denuncia deve estar no formato AAAA-MM-DD.");

  if (issues.length > 0) throw new DomainValidationError(issues);
}

export function assertExistingDenuncia(denunciaId: string, denuncias: Denuncia[]) {
  if (!denuncias.some((denuncia) => denuncia.id === denunciaId)) {
    throw new DomainValidationError(["Denuncia nao encontrada."]);
  }
}

export function assertValidManutencao(posteId: string, manutencao: Manutencao, postes: Poste[]) {
  const issues: string[] = [];

  if (!postes.some((poste) => poste.id === posteId)) issues.push("Manutencao deve estar vinculada a um poste existente.");
  if (isBlank(manutencao.descricao) || manutencao.descricao.trim().length < 8) {
    issues.push("Descricao da manutencao deve ter pelo menos 8 caracteres.");
  }
  if (isBlank(manutencao.responsavel)) issues.push("Responsavel pela manutencao e obrigatorio.");
  if (!isValidDate(manutencao.data)) issues.push("Data da manutencao deve estar no formato AAAA-MM-DD.");

  if (issues.length > 0) throw new DomainValidationError(issues);
}
