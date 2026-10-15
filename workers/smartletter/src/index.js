const RESEND_CONTACTS_URL = "https://api.resend.com/contacts";
const MAX_REQUEST_BYTES = 4096;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function allowedOrigins(env) {
  return new Set(
    (env.ALLOWED_ORIGINS || "")
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
  );
}

function responseHeaders(origin = "") {
  const headers = {
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8",
    Vary: "Origin",
  };

  if (origin) {
    headers["Access-Control-Allow-Origin"] = origin;
  }

  return headers;
}

function json(body, status, origin = "") {
  return new Response(JSON.stringify(body), {
    status,
    headers: responseHeaders(origin),
  });
}

function success(origin) {
  return json(
    { success: true, message: "Thanks for subscribing!" },
    200,
    origin,
  );
}

function resendHeaders(apiKey) {
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
}

async function addExistingContactToSegment(email, env) {
  const contact = encodeURIComponent(email);
  const segment = encodeURIComponent(env.RESEND_SEGMENT_ID);

  return fetch(
    `${RESEND_CONTACTS_URL}/${contact}/segments/${segment}`,
    {
      method: "POST",
      headers: resendHeaders(env.RESEND_API_KEY),
    },
  );
}

async function subscribe(email, env) {
  const createResponse = await fetch(RESEND_CONTACTS_URL, {
    method: "POST",
    headers: resendHeaders(env.RESEND_API_KEY),
    body: JSON.stringify({
      email,
      unsubscribed: false,
      segments: [{ id: env.RESEND_SEGMENT_ID }],
    }),
  });

  if (createResponse.ok) {
    return createResponse;
  }

  // A repeat signup should still ensure the existing contact belongs to the
  // Tunjos Smartletter segment without revealing whether the address exists.
  if (createResponse.status === 409) {
    return addExistingContactToSegment(email, env);
  }

  return createResponse;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "";
    const originAllowed = allowedOrigins(env).has(origin);

    if (url.pathname !== "/subscribe") {
      return json({ success: false, message: "Not found." }, 404);
    }

    if (request.method === "OPTIONS") {
      if (!originAllowed) {
        return json({ success: false, message: "Origin not allowed." }, 403);
      }

      return new Response(null, {
        status: 204,
        headers: responseHeaders(origin),
      });
    }

    if (request.method !== "POST") {
      return json(
        { success: false, message: "Method not allowed." },
        405,
        originAllowed ? origin : "",
      );
    }

    if (!originAllowed) {
      return json({ success: false, message: "Origin not allowed." }, 403);
    }

    if (!env.RESEND_API_KEY || !env.RESEND_SEGMENT_ID) {
      console.error("Required Resend configuration is missing.");
      return json(
        { success: false, message: "Subscription service is unavailable." },
        503,
        origin,
      );
    }

    const contentLength = Number(request.headers.get("Content-Length") || 0);
    if (contentLength > MAX_REQUEST_BYTES) {
      return json({ success: false, message: "Request is too large." }, 413, origin);
    }

    let input;
    try {
      input = await request.json();
    } catch {
      return json({ success: false, message: "Invalid request." }, 400, origin);
    }

    // This field is hidden from people in the site form. Bots commonly fill it.
    if (input.website) {
      return success(origin);
    }

    const email =
      typeof input.email === "string" ? input.email.trim().toLowerCase() : "";

    if (!email || email.length > 254 || !EMAIL_PATTERN.test(email)) {
      return json(
        { success: false, message: "Please enter a valid email address." },
        400,
        origin,
      );
    }

    try {
      const resendResponse = await subscribe(email, env);

      if (resendResponse.ok || resendResponse.status === 409) {
        return success(origin);
      }

      console.error("Resend request failed:", resendResponse.status);
    } catch (error) {
      console.error("Could not reach Resend:", error.name);
    }

    return json(
      {
        success: false,
        message: "Could not subscribe right now. Please try again later.",
      },
      502,
      origin,
    );
  },
};
