import { createHmac, timingSafeEqual } from "node:crypto";
import { loadProfile } from "./lib/cv.mjs";
import { providerConfig, callModel } from "./lib/ai.mjs";

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

function tryParseJSON(text) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

/* ── /api/generate ────────────────────────────────────────────── */
export default async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  if (!requireAuth(req)) return json({ error: "Unauthorized" }, 401);

  const cfg = providerConfig();
  if (!cfg.apiKey) {
    return json(
      {
        error:
          "AI is not configured. Set ANTHROPIC_API_KEY (default), or AI_PROVIDER=openai with AI_API_KEY / AI_BASE_URL / AI_MODEL for a free provider like Hugging Face.",
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

  const profile = await loadProfile();
  const { system, user } = buildMessages({ ...body, profile });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 24000);

  try {
    let text = await callModel(cfg, system, user, controller.signal);
    let result = tryParseJSON(text);
    if (!result) {
      // Open models are less disciplined at strict JSON — one stricter retry.
      text = await callModel(
        cfg,
        system,
        `${user}\n\nIMPORTANT: Output ONLY the raw JSON object — no prose, no markdown, no code fences.`,
        controller.signal,
      );
      result = tryParseJSON(text);
    }
    clearTimeout(timer);

    if (!result) {
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
  } catch (e) {
    clearTimeout(timer);
    if (e?.name === "AbortError") {
      return json(
        {
          error:
            "Generation timed out (the model may be waking up). Try again, or use a faster model — e.g. AI_MODEL to a smaller HF model, or ANTHROPIC_MODEL=claude-haiku-4-5.",
        },
        504,
      );
    }
    if (e?.status) {
      return json({ error: `AI request failed (${e.status}).`, detail: String(e.detail || "").slice(0, 400) }, 502);
    }
    return json({ error: "Could not reach the AI service." }, 502);
  }
};
