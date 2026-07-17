import { createHmac, createHash, timingSafeEqual } from "node:crypto";

/* ── tiny helpers ─────────────────────────────────────────────── */
const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });

const b64url = (buf) => Buffer.from(buf).toString("base64url");

function sign(payload, secret) {
  const body = b64url(JSON.stringify(payload));
  const sig = b64url(createHmac("sha256", secret).update(body).digest());
  return `${body}.${sig}`;
}

// constant-time string compare (hash first so lengths never leak)
function safeEqual(a, b) {
  const ha = createHash("sha256").update(String(a)).digest();
  const hb = createHash("sha256").update(String(b)).digest();
  return timingSafeEqual(ha, hb);
}

/* ── POST /api/auth  { password }  ->  { token } ──────────────── */
export default async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const pass = process.env.ADMIN_PASSWORD;
  const secret = process.env.ADMIN_JWT_SECRET;
  if (!pass || !secret) {
    return json(
      {
        error:
          "Admin auth is not configured. Set ADMIN_PASSWORD and ADMIN_JWT_SECRET in your Netlify environment variables.",
      },
      503,
    );
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid request body" }, 400);
  }

  if (!body?.password || !safeEqual(body.password, pass)) {
    return json({ error: "Invalid password" }, 401);
  }

  const token = sign(
    { sub: "admin", iat: Date.now(), exp: Date.now() + 7 * 24 * 60 * 60 * 1000 },
    secret,
  );
  return json({ token });
};
