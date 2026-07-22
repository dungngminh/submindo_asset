import test from "node:test";
import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { crawlPromos } from "../src/crawl.mjs";

const fixture = `<?xml version="1.0"?><rss><channel><item><guid>https://slickdeals.net/f/123</guid><title>Netflix 50% off</title><link>https://slickdeals.net/f/123</link></item></channel></rss>`;

async function setup() {
  const root = await mkdtemp(join(tmpdir(), "submindo-promo-"));
  await writeFile(join(root, "promos.json"), JSON.stringify({ version: 1, promos: [] }));
  await mkdir(join(root, "promo"));
  await writeFile(join(root, "promo/config.json"), JSON.stringify({ feeds: [{ source: "test", url: "https://feed.test/rss" }], aliases: {} }));
  return root;
}

function fakeFetch(url) {
  if (url.endsWith("type.json")) return Promise.resolve({ ok: true, text: async () => JSON.stringify({ data: [{ icon: "netflix", name: "Netflix" }] }) });
  return Promise.resolve({ ok: true, text: async () => fixture });
}

test("writes a changed feed atomically and dry-run does not write", async () => {
  const root = await setup();
  const before = await readFile(join(root, "promos.json"), "utf8");
  const dry = await crawlPromos({ rootDir: root, fetchImpl: fakeFetch, dryRun: true });
  assert.equal(dry.changed, true);
  assert.equal(await readFile(join(root, "promos.json"), "utf8"), before);
  await crawlPromos({ rootDir: root, fetchImpl: fakeFetch });
  const saved = JSON.parse(await readFile(join(root, "promos.json"), "utf8"));
  assert.equal(saved.version, 2);
  assert.equal(saved.promos[0].service, "netflix");
});

test("does not write when a configured feed fails", async () => {
  const root = await setup();
  const before = await readFile(join(root, "promos.json"), "utf8");
  await assert.rejects(() => crawlPromos({ rootDir: root, fetchImpl: async () => { throw new Error("offline"); } }));
  assert.equal(await readFile(join(root, "promos.json"), "utf8"), before);
});
