import { getStore } from "@netlify/blobs";
import { createHmac, timingSafeEqual, randomUUID } from "node:crypto";

const STORE = "portfolio-projects";
const KEY = "all";

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });

const b64url = (buf) => Buffer.from(buf).toString("base64url");

/* verify a token minted by auth.mjs */
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
  const header = req.headers.get("authorization") || "";
  const token = header.replace(/^Bearer\s+/i, "");
  return !!verify(token, secret);
}

const asArray = (v) =>
  Array.isArray(v) ? v : typeof v === "string" && v.trim() ? [v] : [];

/* Normalise / sanitise an incoming project so the public site can always
   render it against the same shape the front-end expects. */
function normalise(input) {
  return {
    id: input.id || randomUUID(),
    title: String(input.title || "Untitled").slice(0, 120),
    tech: String(input.tech || "").slice(0, 120),
    category: String(input.category || "Project").slice(0, 60),
    year: String(input.year || new Date().getFullYear()).slice(0, 20),
    color: /^#[0-9a-fA-F]{3,8}$/.test(input.color || "") ? input.color : "#22d3ee",
    emoji: String(input.emoji || "").slice(0, 8),
    desc: String(input.desc || "").slice(0, 2000),
    challenge: String(input.challenge || "").slice(0, 2000),
    github: String(input.github || "").slice(0, 500),
    liveUrl: String(input.liveUrl || "").slice(0, 500),
    stack: asArray(input.stack).map((s) => String(s).slice(0, 60)).slice(0, 20),
    features: asArray(input.features).map((s) => String(s).slice(0, 300)).slice(0, 20),
    images: asArray(input.images).map((s) => String(s)).slice(0, 6),
    createdAt: input.createdAt || Date.now(),
    updatedAt: Date.now(),
  };
}

async function readList(store) {
  return (await store.get(KEY, { type: "json" })) || [];
}

/* ── /api/projects ────────────────────────────────────────────── */
export default async (req) => {
  // Auth-gate mutations before touching anything else.
  const mutating = req.method !== "GET";
  if (mutating && !requireAuth(req)) return json({ error: "Unauthorized" }, 401);

  let store;
  try {
    store = getStore(STORE);
  } catch {
    // Blobs only configures itself inside the Netlify runtime; a public
    // read should still degrade to an empty list rather than a 500.
    if (req.method === "GET") return json([]);
    return json({ error: "Storage is not available in this environment" }, 500);
  }

  // Public read
  if (req.method === "GET") {
    const list = await readList(store);
    return json(list);
  }

  if (req.method === "POST" || req.method === "PUT") {
    let body;
    try {
      body = await req.json();
    } catch {
      return json({ error: "Invalid request body" }, 400);
    }
    const project = normalise(body);
    const list = await readList(store);
    const idx = list.findIndex((p) => p.id === project.id);
    if (idx >= 0) {
      project.createdAt = list[idx].createdAt || project.createdAt;
      list[idx] = project;
    } else {
      list.unshift(project);
    }
    await store.setJSON(KEY, list);
    return json(project);
  }

  if (req.method === "DELETE") {
    const id = new URL(req.url).searchParams.get("id");
    if (!id) return json({ error: "Missing id" }, 400);
    const list = await readList(store);
    const next = list.filter((p) => p.id !== id);
    await store.setJSON(KEY, next);
    return json({ ok: true, removed: list.length - next.length });
  }

  return json({ error: "Method not allowed" }, 405);
};
