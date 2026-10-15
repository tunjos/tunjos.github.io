import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import worker from "../src/index.js";

const env = {
  ALLOWED_ORIGINS: "https://tunjos.co,https://www.tunjos.co",
  RESEND_API_KEY: "re_test",
  RESEND_SEGMENT_ID: "segment-test",
};

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

function request(body, options = {}) {
  return new Request("https://tunjos-smartletter.example/subscribe", {
    method: options.method || "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: options.origin || "https://tunjos.co",
    },
    body: options.method === "OPTIONS" ? undefined : JSON.stringify(body),
  });
}

test("creates a subscribed contact in the Smartletter segment", async () => {
  let resendRequest;
  globalThis.fetch = async (url, options) => {
    resendRequest = { url, options };
    return new Response(JSON.stringify({ id: "contact-test" }), { status: 201 });
  };

  const response = await worker.fetch(
    request({ email: " Reader@Example.com ", website: "" }),
    env,
  );

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    success: true,
    message: "Thanks for subscribing!",
  });
  assert.equal(resendRequest.url, "https://api.resend.com/contacts");
  assert.equal(resendRequest.options.headers.Authorization, "Bearer re_test");
  assert.deepEqual(JSON.parse(resendRequest.options.body), {
    email: "reader@example.com",
    unsubscribed: false,
    segments: [{ id: "segment-test" }],
  });
});

test("adds an existing contact to the Smartletter segment", async () => {
  const urls = [];
  globalThis.fetch = async (url) => {
    urls.push(url);
    return urls.length === 1
      ? new Response(null, { status: 409 })
      : new Response(null, { status: 200 });
  };

  const response = await worker.fetch(
    request({ email: "reader@example.com", website: "" }),
    env,
  );

  assert.equal(response.status, 200);
  assert.deepEqual(urls, [
    "https://api.resend.com/contacts",
    "https://api.resend.com/contacts/reader%40example.com/segments/segment-test",
  ]);
});

test("rejects requests from other browser origins", async () => {
  globalThis.fetch = async () => {
    assert.fail("Resend must not be called for a disallowed origin");
  };

  const response = await worker.fetch(
    request(
      { email: "reader@example.com", website: "" },
      { origin: "https://example.com" },
    ),
    env,
  );

  assert.equal(response.status, 403);
  assert.equal(response.headers.has("Access-Control-Allow-Origin"), false);
});

test("answers an allowed CORS preflight", async () => {
  const response = await worker.fetch(
    request(undefined, { method: "OPTIONS" }),
    env,
  );

  assert.equal(response.status, 204);
  assert.equal(
    response.headers.get("Access-Control-Allow-Origin"),
    "https://tunjos.co",
  );
});

test("silently accepts honeypot submissions without contacting Resend", async () => {
  globalThis.fetch = async () => {
    assert.fail("Resend must not be called for a honeypot submission");
  };

  const response = await worker.fetch(
    request({ email: "bot@example.com", website: "filled-by-bot" }),
    env,
  );

  assert.equal(response.status, 200);
});
