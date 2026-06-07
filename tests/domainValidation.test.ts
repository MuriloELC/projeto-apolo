import assert from "node:assert/strict";
import test from "node:test";
import { mockPostes } from "../src/data/mockPostes";
import { mockDenuncias } from "../src/data/mockDenuncias";
import { mockOrdens } from "../src/data/mockOrdens";
import { Denuncia } from "../src/types/Denuncia";
import { OrdemServico } from "../src/types/OrdemServico";
import { Poste } from "../src/types/Poste";
import {
  DomainValidationError,
  assertExistingDenuncia,
  assertExistingOrdem,
  assertValidDenuncia,
  assertValidManutencao,
  assertValidOrdem,
  assertValidPoste,
} from "../src/utils/domainValidation";

test("accepts a valid poste from the seed data", () => {
  assert.doesNotThrow(() => assertValidPoste(mockPostes[0], mockPostes));
});

test("rejects duplicate poste code and invalid purchase/install dates", () => {
  const invalidPoste: Poste = {
    ...mockPostes[0],
    id: "new-poste",
    patrimonioId: "PAT-NEW",
    luminaria: {
      ...mockPostes[0].luminaria,
      id: "new-lum",
      posteId: "new-poste",
      dataCompra: "2026-10-10",
      dataInstalacao: "2026-01-10",
    },
  };

  assert.throws(() => assertValidPoste(invalidPoste, mockPostes), DomainValidationError);
});

test("validates order linkage to an existing poste", () => {
  const ordem: OrdemServico = {
    id: "os-test",
    codigo: "OS-9999",
    posteId: "missing-poste",
    origem: "manual",
    tipo: "vistoria",
    prioridade: "media",
    status: "aberta",
    descricao: "Vistoria completa",
    dataAbertura: "2026-06-06",
    dataAtualizacao: "2026-06-06",
    atualizadaPor: "Teste",
    criadaPor: "Teste",
  };

  assert.throws(() => assertValidOrdem(ordem, mockPostes), DomainValidationError);
  assert.throws(() => assertExistingOrdem("missing-os", mockOrdens), DomainValidationError);
});

test("validates order created from denuncia source", () => {
  const ordem: OrdemServico = {
    id: "os-denuncia",
    codigo: "OS-1000",
    posteId: "2",
    origem: "denuncia",
    denunciaId: "den-1",
    denunciaCodigo: "DEN-0001",
    solicitante: "Cidadao",
    tipo: "troca_lampada",
    prioridade: "alta",
    status: "aberta",
    descricao: "Atender denuncia de luminaria apagada",
    dataAbertura: "2026-06-06",
    dataAtualizacao: "2026-06-06",
    atualizadaPor: "Equipe",
    criadaPor: "Equipe",
  };

  assert.doesNotThrow(() => assertValidOrdem(ordem, mockPostes, mockDenuncias));
  assert.throws(() => assertValidOrdem({ ...ordem, posteId: "1" }, mockPostes, mockDenuncias), DomainValidationError);
  assert.throws(() => assertValidOrdem({ ...ordem, denunciaId: "missing-denuncia" }, mockPostes, mockDenuncias), DomainValidationError);
});

test("validates concluded order traceability fields", () => {
  const ordem: OrdemServico = {
    id: "os-concluida",
    codigo: "OS-1001",
    posteId: "1",
    origem: "manual",
    tipo: "vistoria",
    prioridade: "baixa",
    status: "concluida",
    descricao: "Vistoria concluida em campo",
    dataAbertura: "2026-06-01",
    dataAtualizacao: "2026-06-06",
    atualizadaPor: "Equipe",
    criadaPor: "Equipe",
  };

  assert.throws(() => assertValidOrdem(ordem, mockPostes), DomainValidationError);
  assert.doesNotThrow(() =>
    assertValidOrdem({ ...ordem, dataConclusao: "2026-06-06", concluidaPor: "Equipe" }, mockPostes),
  );
});

test("validates denuncia coordinates and required text", () => {
  const denuncia: Denuncia = {
    id: "den-test",
    codigo: "DEN-9999",
    tipo: "outro",
    status: "recebida",
    descricao: "curta",
    enderecoReferencia: "",
    bairro: "Centro",
    latitude: 120,
    longitude: -61,
    criadaPorId: "usr-cidadao",
    criadaPorNome: "Cidadao",
    dataAbertura: "2026-06-06",
    dataAtualizacao: "2026-06-06",
  };

  assert.throws(() => assertValidDenuncia(denuncia, mockPostes), DomainValidationError);
  assert.throws(() => assertExistingDenuncia("missing-denuncia", mockDenuncias), DomainValidationError);
});

test("validates maintenance linkage and description", () => {
  assert.throws(
    () =>
      assertValidManutencao(
        "missing-poste",
        {
          id: "mnt-test",
          descricao: "curta",
          data: "2026-06-06",
          responsavel: "Equipe",
        },
        mockPostes,
      ),
    DomainValidationError,
  );
});
