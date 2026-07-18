import { createHmac, timingSafeEqual } from "node:crypto";
import { loadProfile } from "./lib/cv.mjs";

/* ── auth (mirrors auth.mjs / projects.mjs) ───────────────────── */
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

/* ── prompt construction ──────────────────────────────────────── */
function buildMessages({ profile, jobDescription, company, role, tone, language, outputs }) {
  const want = [];
  if (outputs?.letter !== false) want.push("a tailored motivation/cover letter");
  if (outputs?.resume !== false) want.push("a tailored resume");

  const system = [
    "You are an expert career writer and CV strategist helping a candidate apply for a specific job.",
    "You write natural, human, confident prose — never generic, never robotic, no clichés like 'I am writing to express my interest'.",
    "You ONLY use facts present in the candidate profile provided. Never invent employers, dates, degrees, or metrics.",
    "You tailor emphasis to the target job: surface the most relevant experience and skills first, mirror the job's language where truthful.",
    "You output STRICT, valid JSON only — no markdown, no commentary, no code fences.",
  ].join(" ");

  const schema = `Return JSON with exactly this shape (omit a top-level key only if that output was not requested):
{
  "coverLetter": {
    "greeting": "Dear Hiring Team,"            // use the company/role if known
    "paragraphs": ["...", "...", "..."],        // 3-4 tight paragraphs, first-person, specific to THIS job
    "closing": "Kind regards,",
    "signature": "${profile.name}"
  },
  "resume": {
    "headline": "short professional headline tuned to the role",
    "summary": "2-3 sentence profile tailored to the job",
    "highlights": ["3-5 punchy, role-relevant selling points drawn from the profile"],
    "skills": ["the most relevant skills for THIS job, reordered, ~12-16 items"],
    "experience": [ { "role": "...", "company": "...", "period": "...", "bullets": ["reworded to emphasise what matters for this job"] } ],
    "education": [ { "degree": "...", "school": "...", "period": "..." } ],
    "languages": ["..."]
  }
}`;

  const user = [
    `CANDIDATE PROFILE (source of truth — do not contradict):`,
    JSON.stringify(profile),
    ``,
    `TARGET JOB:`,
    company ? `Company: ${company}` : `Company: (not specified)`,
    role ? `Role: ${role}` : `Role: (infer from the description)`,
    `Job description / posting:`,
    jobDescription || "(none provided — write a strong general application for the role above)",
    ``,
    `PREFERENCES:`,
    `Language: write everything in ${language === "de" ? "German" : "English"}.`,
    `Tone: ${tone || "professional and warm"}.`,
    `Produce: ${want.join(" and ")}.`,
    ``,
    schema,
    ``,
    `Respond with the JSON object only.`,
  ].join("\n");

  return { system, user };
}

function extractJSON(text) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("Model did not return JSON");
  return JSON.parse(text.slice(start, end + 1));
}

/* ── /api/generate ────────────────────────────────────────────── */
export default async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  if (!requireAuth(req)) return json({ error: "Unauthorized" }, 401);

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return json(
      { error: "AI is not configured. Set ANTHROPIC_API_KEY in your Netlify environment variables." },
      503,
    );
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid request body" }, 400);
  }

  const profile = await loadProfile();
  const { system, user } = buildMessages({ ...body, profile });
  const model = process.env.ANTHROPIC_MODEL || "claude-opus-4-8";

  // Guard against the serverless wall-clock limit.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 24000);

  let resp;
  try {
    resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: 6000,
        system,
        messages: [{ role: "user", content: user }],
      }),
    });
  } catch (e) {
    clearTimeout(timer);
    if (e.name === "AbortError") {
      return json(
        { error: "Generation timed out. Try a faster model by setting ANTHROPIC_MODEL=claude-haiku-4-5 (or claude-sonnet-5)." },
        504,
      );
    }
    return json({ error: "Could not reach the AI service." }, 502);
  }
  clearTimeout(timer);

  if (!resp.ok) {
    const detail = await resp.text().catch(() => "");
    return json({ error: `AI request failed (${resp.status}).`, detail: detail.slice(0, 400) }, 502);
  }

  const data = await resp.json();
  const text = (data.content || [])
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("");

  let result;
  try {
    result = extractJSON(text);
  } catch {
    return json({ error: "The AI returned an unexpected format. Please try again." }, 502);
  }

  return json({
    result,
    profile: {
      name: profile.name,
      email: profile.email,
      phone: profile.phone,
      location: profile.location,
      website: profile.website,
      title: profile.title,
    },
  });
};
