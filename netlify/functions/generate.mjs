import { getStore } from "@netlify/blobs";
import { createHmac, timingSafeEqual } from "node:crypto";

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

/* ── Default profile (from Adhurim's CV) ──────────────────────────
   Used as the source of truth for tailoring. Editable at runtime by
   saving an override to the "portfolio-profile" blob store. */
const DEFAULT_PROFILE = {
  name: "Adhurim Thaqi",
  title: "Software Developer · UI/UX Designer · Game & Immersive Tech Developer",
  email: "adhurimthaqi@gmx.ch",
  phone: "+41 79 891 05 02",
  location: "Dübendorf, Switzerland",
  website: "adhurim.ch",
  summary:
    "Immersive Technologies student at HSLU Luzern with a strong foundation in frontend development, UI/UX design, 3D modelling, and game development. Proven track record delivering responsive web solutions, SEO-optimized sites, and scalable full-stack applications for Swiss and international clients — a dual-threat creative who codes with engineering precision and designs with high-end aesthetic sensibility.",
  experience: [
    {
      role: "Software Engineer Project (Academic)",
      company: "HSLU — School Project, Switzerland",
      period: "2025 – Present",
      bullets: [
        "Architected full-stack applications with Java (Spring Boot) & Node.js in a cross-functional Agile team.",
        "Implemented Docker containerization and CI/CD pipelines, reducing deployment time.",
        "Deployed and maintained services on AWS & Azure cloud infrastructure.",
        "Conducted code reviews, improving codebase quality and team velocity.",
      ],
    },
    {
      role: "Freelance Developer & Designer",
      company: "Remote — Multiple International Clients",
      period: "2023 – Present",
      bullets: [
        "Engineered 15+ responsive web applications using React.js, Vue.js, and WordPress.",
        "Designed pixel-perfect UI/UX prototypes in Figma and Adobe XD, reducing revision cycles by 30%.",
        "Developed and shipped mobile applications using Flutter and React Native.",
        "Implemented SEO best practices, consistently achieving Page 1 search rankings.",
      ],
    },
    {
      role: "Freelance Web Developer",
      company: "ASM Promissa GmbH, Switzerland",
      period: "2023 – Present",
      bullets: [
        "Designed and developed a fully responsive modern business website from scratch.",
        "Improved page load speed by 30% through performance optimisation and asset compression.",
        "Implemented targeted SEO strategies, achieving consistent top-3 search rankings.",
        "Integrated contact forms, email automation, and secure navigation flows.",
      ],
    },
    {
      role: "Graphic & Interior Designer / Customer Representative",
      company: "OnaCandy & TelePerformance, Kosovo",
      period: "2023 – 2024",
      bullets: [
        "Spearheaded brand identity design: logos, marketing collateral, and social media assets.",
        "Developed 3D architectural visualisations and interior models using AutoCAD, Blender & 3ds Max.",
        "Achieved 100% customer satisfaction rating as Customer Sales Representative.",
      ],
    },
  ],
  games: [
    "CoinQuest — 2D/3D adventure game (Unity/C#) with enemy AI, pathfinding, and procedural level generation.",
    "Ghost Seekers — AR ghost-hunting game (Unity/C#/AR) with AI behaviour trees and spatial audio.",
    "Museum Game — educational interactive museum experience (Unity/C#/Blender) applying HCI and UX research.",
  ],
  education: [
    {
      degree: "BSc Informatics — Immersive Technologies",
      school: "Hochschule Luzern (HSLU), Switzerland",
      period: "Sep 2025 – Present",
      detail: "AR/VR, Game Design, 3D Modelling, Computer Vision & AI, HCI, Agile. 180 ECTS.",
    },
    {
      degree: "BSc Computer Science — Software Design",
      school: "University of Prizren 'Ukshin Hoti', Kosovo",
      period: "Oct 2020 – Dec 2023",
      detail: "Focus on Software Design, Algorithms, and System Architecture.",
    },
  ],
  skills: {
    Frontend: ["HTML5", "CSS3", "JavaScript", "React.js", "Vue.js", "React Native", "Flutter", "WordPress"],
    Backend: ["Java", "Spring Boot", "Node.js", "REST APIs", "MySQL", "MongoDB", "Firebase"],
    DevOps: ["Docker", "CI/CD", "AWS", "Azure", "Git", "GitHub"],
    Design: ["Figma", "Adobe XD", "Photoshop", "Illustrator"],
    "Game & 3D": ["Unity", "C#", "Blender", "AutoCAD", "3ds Max", "AR/VR"],
  },
  languages: [
    "Albanian — Native",
    "English — Fluent (B2/C1)",
    "German — Advanced (B1/B2)",
    "Bosnian / Turkish — Basic",
  ],
};

async function loadProfile() {
  try {
    const store = getStore("portfolio-profile");
    const saved = await store.get("profile", { type: "json" });
    if (saved && typeof saved === "object") return saved;
  } catch {
    /* Blobs unavailable locally — fall through to default */
  }
  return DEFAULT_PROFILE;
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

  return json({ result, profile: { name: profile.name, email: profile.email, phone: profile.phone, location: profile.location, website: profile.website, title: profile.title } });
};
