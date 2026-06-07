import assert from "node:assert/strict";
import test from "node:test";
import { mockPostes } from "../src/data/mockPostes";
import { applyManutencaoToPostes } from "../src/utils/assetMaintenance";

test("applies maintenance history and final asset states to a poste", () => {
  const updatedPostes = applyManutencaoToPostes(
    mockPostes,
    "2",
    {
      id: "mnt-form",
      descricao: "Troca de luminaria e revisao do braco",
      data: "2026-06-06",
      responsavel: "Equipe de Campo",
    },
    {
      status: "ativo",
      luminariaEstado: "funcionando",
      bracoEstado: "bom",
    },
  );
  const updatedPoste = updatedPostes.find((poste) => poste.id === "2");

  assert.equal(updatedPoste?.status, "ativo");
  assert.equal(updatedPoste?.luminaria.estado, "funcionando");
  assert.equal(updatedPoste?.braco.estado, "bom");
  assert.equal(updatedPoste?.historicoManutencoes[0].id, "mnt-form");
  assert.equal(updatedPoste?.dataAtualizacao, "2026-06-06");
  assert.equal(updatedPoste?.atualizadoPor, "Equipe de Campo");
});
