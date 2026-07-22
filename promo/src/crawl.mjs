import { readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { extractPromoDetails } from "./gemini.mjs";
import { mergePromos } from "./promo-model.mjs";
import { buildServiceMatchers, matchServices, parseFeed, toPromoCandidate } from "./rss.mjs";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const defaultRoot = join(scriptDir, "../..");

async function fetchText(url, fetchImpl) {
  const response = await fetchImpl(url, { headers: { accept: "application/rss+xml, application/xml, text/xml" } });
  if (!response.ok) throw new Error(`${url} returned HTTP ${response.status}`);
  return response.text();
}

export async function crawlPromos({
  rootDir = defaultRoot,
  today = new Date().toISOString().slice(0, 10),
  fetchImpl = fetch,
  geminiApiKey = process.env.GEMINI_API_KEY,
  dryRun = false
} = {}) {
  const config = JSON.parse(await readFile(join(rootDir, "promo/config.json"), "utf8"));
  const typeFile = JSON.parse(await fetchText("https://dungngminh.github.io/submindo_asset/type.json", fetchImpl));
  const current = JSON.parse(await readFile(join(rootDir, "promos.json"), "utf8"));
  const matchers = buildServiceMatchers(typeFile, config);
  const discovered = [];

  for (const feed of config.feeds ?? []) {
    const xml = await fetchText(feed.url, fetchImpl);
    for (const item of parseFeed(xml, feed.source)) {
      for (const service of matchServices(item, matchers)) {
        const candidate = toPromoCandidate(item, service);
        try {
          Object.assign(candidate, await extractPromoDetails({
            text: `${item.title}\n${item.description}`,
            apiKey: geminiApiKey,
            fetchImpl
          }));
        } catch {
          // Base RSS data remains useful when optional enrichment is unavailable.
        }
        discovered.push(candidate);
      }
    }
  }

  const next = mergePromos({ current, discovered, today });
  const changed = JSON.stringify(current) !== JSON.stringify(next);
  if (changed && !dryRun) {
    const target = join(rootDir, "promos.json");
    const temporary = `${target}.tmp`;
    await writeFile(temporary, `${JSON.stringify(next, null, 2)}\n`, "utf8");
    await rename(temporary, target);
  }
  return { changed, discoveredCount: discovered.length, next };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const dryRun = process.argv.includes("--dry-run");
  crawlPromos({ dryRun })
    .then(({ changed, discoveredCount, next }) => {
      console.log(JSON.stringify({ changed, discoveredCount, version: next.version }));
    })
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
}
