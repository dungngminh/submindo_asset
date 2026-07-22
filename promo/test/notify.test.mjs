import test from "node:test";
import assert from "node:assert/strict";
import { buildTopicMessages } from "../src/notify.mjs";

const promo = (id, service = "netflix") => ({
  id, service, title: "Deal", code: null, discount: "50%", url: "https://example.test", expires: null, source: "test"
});

test("builds one all-string FCM payload per service and only for new IDs", () => {
  const messages = buildTopicMessages({
    before: { version: 1, promos: [promo("old")] },
    after: { version: 2, promos: [promo("old"), promo("new"), promo("other", "spotify")] },
    types: { data: [{ icon: "netflix", name: "Netflix" }, { icon: "spotify", name: "Spotify" }] }
  });
  assert.equal(messages.length, 2);
  assert.equal(messages[0].message.topic, "promo_netflix");
  assert.equal(messages[0].message.notification.title, "New Netflix deal");
  assert.deepEqual(messages[0].message.data, {
    destination: "promo_deals", service: "netflix", promo_id: "new", promo_count: "1"
  });
});

test("does not create messages when no IDs are new", () => {
  const deal = promo("same");
  assert.deepEqual(buildTopicMessages({ before: { version: 1, promos: [deal] }, after: { version: 2, promos: [deal] }, types: { data: [] } }), []);
});
