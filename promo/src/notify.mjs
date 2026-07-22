import { readFile } from "node:fs/promises";
import { JWT } from "google-auth-library";
import { assertPromoFile, groupNewPromos } from "./promo-model.mjs";

const FCM_SCOPE = "https://www.googleapis.com/auth/firebase.messaging";

export function buildTopicMessages({ before, after, types }) {
  const names = new Map((types.data ?? []).map((type) => [type.icon, type.name]));
  return [...groupNewPromos(before, after)].map(([service, promos]) => ({
    message: {
      topic: `promo_${service}`,
      notification: {
        title: `New ${names.get(service) ?? service} deal`,
        body: `${promos.length} new promotion${promos.length === 1 ? "" : "s"} is ready to view`
      },
      data: {
        destination: "promo_deals",
        service,
        promo_id: promos[0].id,
        promo_count: String(promos.length)
      }
    }
  }));
}

export async function sendTopicMessages({ messages, projectId, serviceAccountJson, fetchImpl = fetch }) {
  if (messages.length === 0) return [];
  const credentials = JSON.parse(serviceAccountJson);
  const client = new JWT({ email: credentials.client_email, key: credentials.private_key, scopes: [FCM_SCOPE] });
  const { access_token: accessToken } = await client.authorize();
  const sent = [];
  for (const body of messages) {
    const response = await fetchImpl(`https://fcm.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/messages:send`, {
      method: "POST",
      headers: { authorization: `Bearer ${accessToken}`, "content-type": "application/json; charset=UTF-8" },
      body: JSON.stringify(body)
    });
    if (!response.ok) throw new Error(`FCM HTTP ${response.status} for ${body.message.topic}`);
    const result = await response.json();
    sent.push({ topic: body.message.topic, name: result.name ?? null });
  }
  return sent;
}

async function main() {
  const args = new Map();
  for (let index = 2; index < process.argv.length; index += 2) args.set(process.argv[index], process.argv[index + 1]);
  const before = JSON.parse(await readFile(args.get("--before"), "utf8"));
  const after = JSON.parse(await readFile(args.get("--after"), "utf8"));
  const types = JSON.parse(await readFile(args.get("--types"), "utf8"));
  const messages = buildTopicMessages({ before: assertPromoFile(before), after: assertPromoFile(after), types });
  const sent = await sendTopicMessages({
    messages,
    projectId: process.env.FIREBASE_PROJECT_ID,
    serviceAccountJson: process.env.FIREBASE_SERVICE_ACCOUNT_JSON
  });
  console.log(JSON.stringify({ messageCount: messages.length, sent }));
}

if (process.argv[1]?.endsWith("notify.mjs")) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
