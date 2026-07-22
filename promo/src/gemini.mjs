function nullableString(value) {
  if (typeof value !== "string" || value.trim() === "") return null;
  return value.trim();
}

function parseDate(value) {
  const date = nullableString(value);
  return date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null;
}

export function validateExtraction(value) {
  return {
    code: nullableString(value?.code),
    discount: nullableString(value?.discount),
    expires: parseDate(value?.expires)
  };
}

export async function extractPromoDetails({ text, apiKey, fetchImpl = fetch }) {
  if (!apiKey) return { code: null, discount: null, expires: null };
  const response = await fetchImpl(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `Extract only explicitly stated promotion details from this source. Return JSON only with nullable string fields code, discount, expires (YYYY-MM-DD). Never invent values.\n\n${text}` }] }],
        generationConfig: { responseMimeType: "application/json" }
      })
    }
  );
  if (!response.ok) throw new Error(`Gemini HTTP ${response.status}`);
  const payload = await response.json();
  const output = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!output) return { code: null, discount: null, expires: null };
  try {
    return validateExtraction(JSON.parse(output.replace(/^```json\s*|\s*```$/g, "")));
  } catch {
    return { code: null, discount: null, expires: null };
  }
}
