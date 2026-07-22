import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  buildServiceMatchers,
  matchServices,
  parseFeed,
  toPromoCandidate
} from "../src/rss.mjs";

const fixture = await readFile(new URL("./fixtures/slickdeals.xml", import.meta.url), "utf8");
const typeFile = {
  data: [
    { icon: "netflix", name: "Netflix" },
    { icon: "hbo-max", name: "HBO Max" },
    { icon: "spotify", name: "Spotify" }
  ]
};

test("parses RSS items, decodes entities, and creates stable source IDs", () => {
  const items = parseFeed(fixture, "slickdeals");
  assert.equal(items.length, 4);
  assert.equal(items[0].id, "slickdeals-12345678");
  assert.match(items[0].title, /&/);
  assert.equal(items[0].url, "https://slickdeals.net/f/12345678");
});

test("matches known names and aliases while rejecting unrelated deals", () => {
  const matchers = buildServiceMatchers(typeFile, { aliases: { "hbo-max": ["hbo max"] } });
  const items = parseFeed(fixture, "slickdeals");
  assert.deepEqual(matchServices(items[0], matchers), ["netflix"]);
  assert.deepEqual(matchServices(items[1], matchers), ["hbo-max"]);
  assert.deepEqual(matchServices(items[2], matchers), []);
});

test("creates nullable enrichment fields for each matched candidate", () => {
  const item = parseFeed(fixture, "slickdeals")[0];
  assert.deepEqual(toPromoCandidate(item, "netflix"), {
    id: "slickdeals-12345678",
    service: "netflix",
    title: item.title,
    code: null,
    discount: null,
    url: item.url,
    expires: null,
    source: "slickdeals"
  });
});
