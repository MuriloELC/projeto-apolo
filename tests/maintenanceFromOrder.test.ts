import assert from "node:assert/strict";
import test from "node:test";
import { mockOrdens } from "../src/data/mockOrdens";
import { mockPostes } from "../src/data/mockPostes";
import { applyConcludedOrdemToPostes, buildManutencaoFromConcludedOrdem } from "../src/utils/maintenanceFromOrder";

test("builds a maintenance record from a concluded work order", () => {
  const manutencao = buildManutencaoFromConcludedOrdem(mockOrdens[0], "Equipe Campo", "2026-06-06");

  assert.equal(manutencao.id, "mnt-os-1-2026-06-06");
  assert.equal(manutencao.data, "2026-06-06");
  assert.equal(manutencao.responsavel, "Equipe Campo");
  assert.match(manutencao.descricao, /OS OS-0001 concluida/);
});

test("applies concluded order maintenance to the related poste only once", () => {
  const ordem = mockOrdens[0];
  const manutencao = buildManutencaoFromConcludedOrdem(ordem, "Equipe Campo", "2026-06-06");
  const firstUpdate = applyConcludedOrdemToPostes(mockPostes, ordem, manutencao);
  const secondUpdate = applyConcludedOrdemToPostes(firstUpdate, ordem, manutencao);
  const updatedPoste = secondUpdate.find((poste) => poste.id === ordem.posteId);

  assert.equal(updatedPoste?.historicoManutencoes.filter((item) => item.id === manutencao.id).length, 1);
  assert.equal(updatedPoste?.atualizadoPor, "Equipe Campo");
  assert.equal(updatedPoste?.dataAtualizacao, "2026-06-06");
});
