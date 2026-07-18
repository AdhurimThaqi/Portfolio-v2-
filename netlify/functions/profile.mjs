import { createHmac, timingSafeEqual } from "node:crypto";
import { loadProfile, saveProfile } from "./lib/cv.mjs";

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });

const b64url = (buf) => Buffer.from(buf).toString("base64url");

function verify(token, secret) {
  if (!token || !token.includes(".")) return null;
  const [body, sig] = token.split(".");
  const expected = b64url(createHmac("sha256", secret).update(body).digest());
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString());
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

function requireAuth(req) {
  const secret = process.env.ADMIN_JWT_SECRET;
  if (!secret) return false;
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  return !!verify(token, secret);
}

/* ── /api/profile (admin only — the CV behind the AI generator) ── */
export default async (req) => {
  if (!requireAuth(req)) return json({ error: "Unauthorized" }, 401);

  if (req.method === "GET") {
    return json(await loadProfile());
  }

  if (req.method === "POST" || req.method === "PUT") {
    let body;
    try {
      body = await req.json();
    } catch {
      return json({ error: "Invalid request body" }, 400);
    }
    try {
      const saved = await saveProfile(body);
      return json(saved);
    } catch {
      return json({ error: "Could not save (storage unavailable in this environment)" }, 500);
    }
  }

  return json({ error: "Method not allowed" }, 405);
};
