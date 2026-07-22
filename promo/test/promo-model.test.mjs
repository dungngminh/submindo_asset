import test from "node:test";
import assert from "node:assert/strict";
import {
  assertPromoFile,
  groupNewPromos,
  mergePromos,
  normalizePromo,
  stableFallbackId
} from "../src/promo-model.mjs";

const base = {
  id: "slickdeals-1",
  service: "netflix",
  title: "Netflix 50% off",
  code: "SAVE50",
  discount: "50%",
  url: "https://example.test/deal/1",
  expires: "2026-08-01",
  source: "slickdeals"
};

test("normalizes optional blank fields and lowercases identifiers", () => {
  assert.deepEqual(normalizePromo({ ...base, service: "NETFLIX", code: "", discount: undefined }), {
    ...base,
    service: "netflix",
    code: null,
    discount: null
  });
});

test("validates required fields, dates, and duplicate IDs", () => {
  assert.throws(() => normalizePromo({ ...base, title: "" }), /title/);
  assert.throws(() => normalizePromo({ ...base, expires: "tomorrow" }), /expires/);
  assert.throws(() => assertPromoFile({ version: 1, promos: [base, base] }), /duplicate/);
});

test("prunes expired deals, keeps today's expiry, and bumps version only on change", () => {
  const current = {
    version: 3,
    promos: [
      { ...base, id: "expired", expires: "2026-07-21" },
      { ...base, id: "today", expires: "2026-07-22" }
    ]
  };
  const next = mergePromos({ current, discovered: [], today: "2026-07-22" });
  assert.equal(next.version, 4);
  assert.deepEqual(next.promos.map(({ id }) => id), ["today"]);
  const unchanged = mergePromos({ current: next, discovered: [], today: "2026-07-22" });
  assert.deepEqual(unchanged, next);
});

test("replaces same-ID records and sorts output deterministically", () => {
  const current = { version: 1, promos: [{ ...base, title: "Old" }] };
  const next = mergePromos({
    current,
    discovered: [
      { ...base, id: "slickdeals-2", service: "spotify" },
      { ...base, title: "New", code: null }
    ],
    today: "2026-07-22"
  });
  assert.equal(next.version, 2);
  assert.deepEqual(next.promos.map(({ service, title }) => [service, title]), [
    ["netflix", "New"],
    ["spotify", "Netflix 50% off"]
  ]);
});

test("groups only IDs that were not in the previous file", () => {
  const before = { version: 1, promos: [base] };
  const after = {
    version: 2,
    promos: [base, { ...base, id: "slickdeals-2", service: "spotify" }]
  };
  assert.deepEqual([...groupNewPromos(before, after).keys()], ["spotify"]);
});

test("fallback IDs are stable and source-scoped", () => {
  assert.equal(stableFallbackId("slickdeals", "https://example.test"), stableFallbackId("slickdeals", "https://example.test"));
  assert.notEqual(stableFallbackId("slickdeals", "https://example.test"), stableFallbackId("other", "https://example.test"));
});
