import test from "node:test";
import assert from "node:assert/strict";
import { extractPromoDetails, validateExtraction } from "../src/gemini.mjs";

test("validates structured Gemini output and rejects invalid dates", () => {
  assert.deepEqual(validateExtraction({ code: " SAVE50 ", discount: "50%", expires: "2026-08-01" }), {
    code: "SAVE50", discount: "50%", expires: "2026-08-01"
  });
  assert.deepEqual(validateExtraction({ code: "", discount: null, expires: "tomorrow" }), {
    code: null, discount: null, expires: null
  });
});

test("parses JSON and fenced JSON without exposing the API key to callers", async () => {
  const calls = [];
  const result = await extractPromoDetails({
    text: "Use SAVE50 before August 1",
    apiKey: "secret",
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      return { ok: true, status: 200, json: async () => ({ candidates: [{ content: { parts: [{ text: `\`\`\`json\n${JSON.stringify({ code: "SAVE50", expires: "2026-08-01" })}\n\`\`\`` }] } }] }) };
    }
  });
  assert.deepEqual(result, { code: "SAVE50", discount: null, expires: "2026-08-01" });
  assert.match(calls[0].url, /key=secret/);
  assert.equal(calls[0].options.headers.authorization, undefined);
});

test("skips Gemini when the key is absent and falls back on malformed output", async () => {
  assert.deepEqual(await extractPromoDetails({ text: "deal" }), { code: null, discount: null, expires: null });
  const result = await extractPromoDetails({
    text: "deal",
    apiKey: "secret",
    fetchImpl: async () => ({ ok: true, status: 200, json: async () => ({ candidates: [{ content: { parts: [{ text: "not json" }] } }] }) })
  });
  assert.deepEqual(result, { code: null, discount: null, expires: null });
});
