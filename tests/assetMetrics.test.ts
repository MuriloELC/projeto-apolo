import assert from "node:assert/strict";
import test from "node:test";
import { mockPostes } from "../src/data/mockPostes";
import {
  countBy,
  installationAgeMonths,
  isWarrantyExpired,
  isWarrantyExpiringSoon,
  toCountRows,
} from "../src/utils/assetMetrics";

test("counts assets by category and sorts rows by count", () => {
  const rows = toCountRows(countBy(mockPostes.map((poste) => poste.luminaria.tipo)));

  assert.equal(rows[0].label, "LED");
  assert.equal(rows[0].count, 2);
});

test("calculates warranty status from purchase date and warranty period", () => {
  const referenceDate = new Date("2026-06-06T00:00:00.000Z");

  assert.equal(isWarrantyExpired(mockPostes[0], referenceDate), false);
  assert.equal(isWarrantyExpiringSoon(mockPostes[1], referenceDate, 30), false);
});

test("calculates installation age in months", () => {
  const age = installationAgeMonths(mockPostes[0], new Date("2026-06-06T00:00:00.000Z"));

  assert.equal(age, 10);
});
