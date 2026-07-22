import { createHash } from "node:crypto";

const REQUIRED_FIELDS = ["id", "service", "title", "url", "source"];
const OPTIONAL_FIELDS = ["code", "discount", "expires"];

function cleanString(value, field, { nullable = false } = {}) {
  if (value === null || value === undefined || value === "") {
    if (nullable) return null;
    throw new TypeError(`${field} must be a non-empty string`);
  }
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError(`${field} must be a non-empty string`);
  }
  return value.trim();
}

export function normalizePromo(value) {
  if (!value || typeof value !== "object") {
    throw new TypeError("promo must be an object");
  }

  const promo = {
    id: cleanString(value.id, "id"),
    service: cleanString(value.service, "service").toLowerCase(),
    title: cleanString(value.title, "title"),
    code: cleanString(value.code, "code", { nullable: true }),
    discount: cleanString(value.discount, "discount", { nullable: true }),
    url: cleanString(value.url, "url"),
    expires: cleanString(value.expires, "expires", { nullable: true }),
    source: cleanString(value.source, "source").toLowerCase()
  };

  if (promo.expires !== null && !/^\d{4}-\d{2}-\d{2}$/.test(promo.expires)) {
    throw new TypeError("expires must be an ISO date or null");
  }
  return promo;
}

export function assertPromoFile(value) {
  if (!value || typeof value !== "object" || !Number.isInteger(value.version) || value.version < 1) {
    throw new TypeError("promo file version must be a positive integer");
  }
  if (!Array.isArray(value.promos)) throw new TypeError("promos must be an array");

  const promos = value.promos.map(normalizePromo);
  const ids = new Set();
  for (const promo of promos) {
    if (ids.has(promo.id)) throw new TypeError(`duplicate promo id: ${promo.id}`);
    ids.add(promo.id);
  }
  return { version: value.version, promos };
}

function sortPromos(promos) {
  return [...promos].sort((a, b) =>
    a.service.localeCompare(b.service) || a.id.localeCompare(b.id)
  );
}

function withoutVersion(file) {
  return JSON.stringify({ promos: sortPromos(file.promos) });
}

export function mergePromos({ current, discovered, today }) {
  const existing = assertPromoFile(current);
  const candidates = discovered.map(normalizePromo);
  const merged = new Map(existing.promos.map((promo) => [promo.id, promo]));
  for (const promo of candidates) merged.set(promo.id, promo);

  const active = sortPromos([...merged.values()].filter((promo) =>
    promo.expires === null || promo.expires >= today
  ));
  const nextWithoutVersion = { promos: active };
  if (withoutVersion(existing) === JSON.stringify(nextWithoutVersion)) return existing;
  return { version: existing.version + 1, promos: active };
}

export function groupNewPromos(before, after) {
  const oldIds = new Set(assertPromoFile(before).promos.map((promo) => promo.id));
  const groups = new Map();
  for (const promo of assertPromoFile(after).promos) {
    if (oldIds.has(promo.id)) continue;
    const list = groups.get(promo.service) ?? [];
    list.push(promo);
    groups.set(promo.service, list);
  }
  return new Map([...groups.entries()].sort(([a], [b]) => a.localeCompare(b)));
}

export function stableFallbackId(source, url) {
  return `${source}-${createHash("sha256").update(`${source}:${url}`).digest("hex").slice(0, 16)}`;
}
