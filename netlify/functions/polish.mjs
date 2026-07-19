import { createHmac, timingSafeEqual } from "node:crypto";
import { providerConfig, callModel } from "./lib/ai.mjs";

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json" } });

const b64url = (buf) => Buffer.from(buf).toString("base64url");
function verify(token, secret) {
  if (!token || !token.includes(".")) return null;
  const [body, sig] = token.split(".");
  const expected = b64url(createHmac("sha256", secret).update(body).digest());
  const a = Buffer.from(sig), b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const p = JSON.parse(Buffer.from(body, "base64url").toString());
    if (p.exp && Date.now() > p.exp) return null;
    return p;
  } catch { return null; }
}
function requireAuth(req) {
  const secret = process.env.ADMIN_JWT_SECRET;
  if (!secret) return false;
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  return !!verify(token, secret);
}

/* ── POST /api/polish { text, instruction? } → { text } (admin) ── */
export default async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  if (!requireAuth(req)) return json({ error: "Unauthorized" }, 401);

  const cfg = providerConfig();
  if (!cfg.apiKey) return json({ error: "AI is not configured. Set ANTHROPIC_API_KEY or the AI_* variables." }, 503);

  let body;
  try { body = await req.json(); } catch { return json({ error: "Invalid request" }, 400); }
  const text = String(body?.text || "").slice(0, 4000).trim();
  if (!text) return json({ error: "No text provided" }, 400);
  const instruction = String(body?.instruction || "Improve this CV text: make it sharper, professional, and impactful. Keep it truthful — do not invent facts, employers, dates, or metrics.").slice(0, 500);

  const system =
    "You are an expert CV editor. Rewrite the user's text per the instruction. Return ONLY the rewritten text — no preamble, no quotes, no markdown. Never invent facts.";
  const user = `${instruction}\n\nTEXT:\n${text}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 22000);
  try {
    const out = await callModel(cfg, system, user, controller.signal, 900);
    clearTimeout(timer);
    const cleaned = String(out || "").replace(/^["'\s]+|["'\s]+$/g, "").trim();
    if (!cleaned) return json({ error: "Empty response — try again." }, 502);
    return json({ text: cleaned });
  } catch (e) {
    clearTimeout(timer);
    if (e?.name === "AbortError") return json({ error: "Timed out — try again or a faster model." }, 504);
    if (e?.status) return json({ error: `AI request failed (${e.status}).` }, 502);
    return json({ error: "Could not reach the AI service." }, 502);
  }
};
