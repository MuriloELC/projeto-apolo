import { Poste } from "../types/Poste";

export type CountRow = {
  label: string;
  count: number;
};

export function countBy<T extends string>(items: T[]) {
  return items.reduce<Record<T, number>>(
    (acc, item) => ({
      ...acc,
      [item]: (acc[item] ?? 0) + 1,
    }),
    {} as Record<T, number>,
  );
}

export function toCountRows(counts: Record<string, number>): CountRow[] {
  return Object.entries(counts)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

export function addMonths(dateText: string, months: number) {
  const date = new Date(dateText);
  if (Number.isNaN(date.getTime())) return null;
  date.setMonth(date.getMonth() + months);
  return date;
}

export function warrantyEndDate(poste: Poste) {
  return addMonths(poste.luminaria.dataCompra, poste.luminaria.garantiaMeses);
}

export function isWarrantyExpired(poste: Poste, referenceDate = new Date()) {
  const endDate = warrantyEndDate(poste);
  if (!endDate) return false;
  return endDate.getTime() < referenceDate.getTime();
}

export function isWarrantyExpiringSoon(poste: Poste, referenceDate = new Date(), days = 120) {
  const endDate = warrantyEndDate(poste);
  if (!endDate) return false;
  const limit = new Date(referenceDate);
  limit.setDate(limit.getDate() + days);
  return endDate.getTime() >= referenceDate.getTime() && endDate.getTime() <= limit.getTime();
}

export function installationAgeMonths(poste: Poste, referenceDate = new Date()) {
  const installedAt = new Date(poste.luminaria.dataInstalacao);
  if (Number.isNaN(installedAt.getTime())) return 0;
  return Math.max(
    0,
    (referenceDate.getFullYear() - installedAt.getFullYear()) * 12 +
      (referenceDate.getMonth() - installedAt.getMonth()),
  );
}

