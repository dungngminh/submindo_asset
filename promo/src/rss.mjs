import { createHash } from "node:crypto";
import { XMLParser } from "fast-xml-parser";
import { stableFallbackId } from "./promo-model.mjs";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
  htmlEntities: true,
  trimValues: true
});

function asArray(value) {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

function text(value) {
  if (value === undefined || value === null) return "";
  if (typeof value === "string" || typeof value === "number") return String(value).trim();
  if (typeof value === "object") return text(value["#text"] ?? value["@_href"] ?? "");
  return "";
}

function stripHtml(value) {
  return text(value).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function itemUrl(item) {
  if (typeof item.link === "object") {
    return text(item.link["@_href"] ?? item.link["#text"]);
  }
  return text(item.link ?? item.guid);
}

function itemId(item, url, source) {
  const guid = text(item.guid ?? item.id);
  if (guid) return `${source}-${guid.replace(/^.*\/(\d+)$/, "$1")}`;
  const match = url.match(/\/f\/(\d+)/);
  if (match) return `${source}-${match[1]}`;
  return stableFallbackId(source, url);
}

export function parseFeed(xml, source) {
  const parsed = parser.parse(xml);
  const channelItems = parsed?.rss?.channel?.item;
  const atomEntries = parsed?.feed?.entry;
  return [...asArray(channelItems), ...asArray(atomEntries)].map((item) => {
    const url = itemUrl(item);
    return {
      id: itemId(item, url, source),
      source,
      title: text(item.title),
      description: stripHtml(item.description ?? item.summary ?? item.content),
      url
    };
  }).filter((item) => item.title && item.url);
}

export function buildServiceMatchers(typeFile, config = {}) {
  const aliases = config.aliases ?? {};
  return (typeFile.data ?? []).flatMap((type) => {
    const slug = text(type.icon).toLowerCase();
    const name = text(type.name).toLowerCase();
    if (!slug || !name) return [];
    const terms = new Set([slug.replaceAll("-", " "), name, ...(aliases[slug] ?? [])]);
    return [{ slug, terms: [...terms].map((term) => term.toLowerCase().trim()).filter(Boolean) }];
  });
}

export function matchServices(item, matchers) {
  const haystack = `${item.title} ${item.description}`.toLowerCase();
  return matchers
    .filter(({ terms }) => terms.some((term) => haystack.includes(term)))
    .map(({ slug }) => slug);
}

export function toPromoCandidate(item, service) {
  return {
    id: item.id,
    service,
    title: item.title,
    code: null,
    discount: null,
    url: item.url,
    expires: null,
    source: item.source
  };
}

export function contentHash(value) {
  return createHash("sha256").update(value).digest("hex");
}
