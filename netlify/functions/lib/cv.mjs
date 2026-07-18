import { getStore } from "@netlify/blobs";

const STORE = "portfolio-profile";
const KEY = "profile";

/* Default CV profile (from Adhurim's CV). Editable at runtime via /api/profile,
   which saves an override into the "portfolio-profile" blob store. Shared by
   generate.mjs (AI source of truth) and profile.mjs (editor). */
export const DEFAULT_PROFILE = {
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

const str = (v, max = 300) => String(v ?? "").slice(0, max);
const arr = (v) => (Array.isArray(v) ? v : []);
const strList = (v, max = 200, cap = 40) =>
  arr(v).map((x) => str(x, max)).filter(Boolean).slice(0, cap);

/* Sanitise an incoming profile so a bad save can't corrupt the shape. */
export function normaliseProfile(input = {}) {
  const skills = {};
  if (input.skills && typeof input.skills === "object") {
    for (const [cat, list] of Object.entries(input.skills)) {
      const name = str(cat, 40).trim();
      if (name) skills[name] = strList(list, 60, 40);
    }
  }
  return {
    name: str(input.name, 120) || "Your Name",
    title: str(input.title, 200),
    email: str(input.email, 160),
    phone: str(input.phone, 60),
    location: str(input.location, 120),
    website: str(input.website, 160),
    summary: str(input.summary, 2000),
    experience: arr(input.experience)
      .map((e) => ({
        role: str(e?.role, 160),
        company: str(e?.company, 160),
        period: str(e?.period, 60),
        bullets: strList(e?.bullets, 400, 12),
      }))
      .slice(0, 20),
    education: arr(input.education)
      .map((e) => ({
        degree: str(e?.degree, 200),
        school: str(e?.school, 200),
        period: str(e?.period, 60),
        detail: str(e?.detail, 400),
      }))
      .slice(0, 12),
    games: strList(input.games, 400, 20),
    languages: strList(input.languages, 120, 20),
    skills,
  };
}

/* Effective profile = saved override, else the built-in default. */
export async function loadProfile() {
  try {
    const saved = await getStore(STORE).get(KEY, { type: "json" });
    if (saved && typeof saved === "object") return saved;
  } catch {
    /* Blobs unavailable (e.g. local vite) — fall through to default */
  }
  return DEFAULT_PROFILE;
}

export async function saveProfile(profile) {
  const clean = normaliseProfile(profile);
  await getStore(STORE).setJSON(KEY, clean);
  return clean;
}
