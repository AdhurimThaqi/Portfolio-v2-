# Portfolio Admin Panel — Setup

Your portfolio now has a private admin panel for managing projects, backed by
Netlify Functions + Netlify Blobs. The public site reads projects from the
backend at runtime and falls back to the built-in game showcase if the backend
is unreachable.

## 1. Set environment variables in Netlify

Go to **Netlify → Site configuration → Environment variables** and add:

| Key                | Value                                                    |
| ------------------ | -------------------------------------------------------- |
| `ADMIN_PASSWORD`   | The password you'll use to sign in to `/admin`           |
| `ADMIN_JWT_SECRET` | A long random string (used to sign login sessions)       |
| `ANTHROPIC_API_KEY`| Your Anthropic API key — powers the Application AI tab (default provider) |
| `ANTHROPIC_MODEL`  | *(optional)* Overrides the model. Defaults to `claude-opus-4-8`. Set to `claude-haiku-4-5` or `claude-sonnet-5` for faster/cheaper generation if you hit the function timeout. |

### Using a free / different AI provider (Hugging Face, Groq, Together, …)

The generator is provider-agnostic. To use any **OpenAI-compatible** endpoint
instead of Anthropic (e.g. Hugging Face's free tier), set:

| Key | Value |
| --- | --- |
| `AI_PROVIDER` | `openai` |
| `AI_API_KEY`  | your provider key (e.g. `hf_…`) |
| `AI_BASE_URL` | e.g. `https://router.huggingface.co/v1` |
| `AI_MODEL`    | e.g. `meta-llama/Llama-3.3-70B-Instruct` |

Leave `AI_PROVIDER` unset (or `anthropic`) to use Claude via `ANTHROPIC_API_KEY`.
Switching providers is env-vars only — no code change. Open models are a bit
less reliable at strict JSON, so the function automatically retries once with a
stricter instruction, and may be slower on a cold start (first request).

### Public AI assistant (the talking avatar widget)

The floating assistant on the public site (`/api/assistant`) uses the **same**
AI key as above — no extra setup. It answers visitors' questions grounded in
your CV + projects, refuses off-topic/impersonation, and speaks via the
browser's built-in text-to-speech. Without a key it shows a friendly "AI isn't
switched on yet" message (never breaks). It's rate-limited per visitor IP;
tune with `ASSISTANT_RATE_LIMIT` (default 25 questions/hour).

Generate a good secret with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

> Until both variables are set, the login endpoint returns a clear
> "not configured" message and refuses all logins — it fails closed.

## 2. Deploy

Push to your deploy branch (Netlify auto-builds). Netlify auto-detects:

- The static site (`dist/`)
- Functions in `netlify/functions/`
- **Netlify Blobs** — no manual setup, it's provisioned automatically

## 3. Use it

- Open **`https://adhurim.ch/admin`**
- Sign in with `ADMIN_PASSWORD`
- Add / edit / delete projects — changes appear on the live site immediately
  (visitors get them on their next page load)

Each project supports: title, tech line, category badge, year, accent colour,
card emoji, description, tech stack, key features, challenge & solution,
GitHub + live URLs, and up to 6 images (auto-compressed in the browser before
upload, so the stored data stays small).

**Video** — paste a YouTube or Vimeo link in the *Video URL* field; it embeds
a player in the project modal. (Don't upload video files — link them instead,
so nothing hits your storage/credits.)

**Playable builds** — export your Unity game to WebGL, host it on **itch.io**
(free, purpose-built for browser games), and paste the link in the *Play URL*
field. It adds a glowing **▶ Play Now** button to the modal, and a
**▶ PLAYABLE** badge on the project's panel in the 3D gallery.

### Application AI (motivation letter + resume)

The **Application AI** tab turns a job posting into a tailored motivation
letter and resume, drawn from your CV:

1. Paste the job description, optionally add the company and role.
2. Pick a tone and language (English or German) and what to produce.
3. Click **Generate** — it returns a classic, print-ready A4 cover letter and
   a tailored resume in a live preview.
4. **Download / Print PDF** → choose “Save as PDF” in the print dialog.

Your CV data lives server-side in `netlify/functions/generate.mjs`
(`DEFAULT_PROFILE`). The AI only uses facts from that profile — it never
invents employers, dates, or metrics. The `ANTHROPIC_API_KEY` stays on the
server; it is never exposed to the browser.

> **Timeout note:** Netlify's free-tier functions cap at ~10s. If Opus
> generations time out, set `ANTHROPIC_MODEL=claude-haiku-4-5` (fast + cheap)
> or `claude-sonnet-5` in your environment variables.

## Local development

```bash
npm install
npm run dev          # public site only (no functions)
```

To run the functions + Blobs locally, use the Netlify CLI:

```bash
npm i -g netlify-cli
netlify dev          # serves site + /api/* functions + local Blobs
```

Set `ADMIN_PASSWORD` and `ADMIN_JWT_SECRET` in a local `.env` for `netlify dev`.

## How it fits together

```
Public site (index.html)  ──GET /api/projects──▶  projects fn ──▶ Netlify Blobs
Admin panel (/admin)      ──POST /api/auth──────▶  auth fn  (issues signed token)
                          ──POST/DELETE /api/projects (Bearer token)──▶ projects fn
```

- `netlify/functions/auth.mjs` — password login, issues an HMAC-signed token
- `netlify/functions/projects.mjs` — public GET; token-gated create/update/delete
- `netlify/functions/generate.mjs` — token-gated; calls the Anthropic API to
  write the tailored letter + resume (key stays server-side)
- `src/admin/` — the admin React app (separate bundle, never shipped to visitors)
- `useProjects()` in `src/portfolio.jsx` — fetches and merges dynamic projects

## CV Builder (generate your CV PDF from the profile)

The **CV Builder** tab renders a clean, classic, ATS-friendly CV **from your
profile data** — edit the profile and the CV updates automatically. Export it
with **Download / Print PDF**, and use **✨ Improve summary with AI** to have
the model sharpen your profile summary (`/api/polish`, uses the same AI key;
never invents facts). No more maintaining a separate PDF by hand.

## Editing your CV profile

Open the **My CV Profile** tab in `/admin` to edit your basics, summary,
experience, skills, education, games, and languages — no code needed. Saving
stores an override in the `portfolio-profile` blob store, and the Application
AI immediately uses it. (The built-in starting point lives in
`netlify/functions/lib/cv.mjs` as `DEFAULT_PROFILE`, used until you save an
edit.)
