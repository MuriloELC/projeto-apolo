import assert from "node:assert/strict";
import test from "node:test";
import { mockDenuncias } from "../src/data/mockDenuncias";
import { mockOrdens } from "../src/data/mockOrdens";
import { mockPostes } from "../src/data/mockPostes";
import { buildDenunciasCsv, buildOrdensCsv, buildPostesCsv } from "../src/utils/reportCsv";

test("builds a complete CSV for postes inventory", () => {
  const csv = buildPostesCsv(mockPostes);
  const lines = csv.split("\n");

  assert.equal(lines.length, mockPostes.length + 1);
  assert.match(lines[0], /"codigo";"patrimonioId";"bairro"/);
  assert.match(csv, /"numeroLicitacao"/);
  assert.match(csv, /"produtoId"/);
});

test("builds CSV reports for work orders and citizen complaints", () => {
  assert.equal(buildOrdensCsv(mockOrdens).split("\n").length, mockOrdens.length + 1);
  assert.equal(buildDenunciasCsv(mockDenuncias).split("\n").length, mockDenuncias.length + 1);
});

test("escapes quotes in CSV cells", () => {
  const csv = buildOrdensCsv([
    {
      ...mockOrdens[0],
      descricao: 'Trocar "driver"; verificar rede',
    },
  ]);

  assert.match(csv, /"Trocar ""driver""; verificar rede"/);
});
